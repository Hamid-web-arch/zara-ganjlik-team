import { sql } from "./_db.js";
import { requireAuth, requireAdmin, hashPassword } from "./_auth.js";

// Every data resource (members, moments, comments, briefings, settings, schedule) is
// routed through this one catch-all file instead of one file per resource/action —
// /api/members/staff, /api/moments/<id>, /api/settings/hero etc. all land here, split out
// to a handler function per resource below.
//
// sql.unsafe(...) below is used only for this one static, hard-coded column list (never
// for request-derived values) — it's not a column the driver's tagged template can bind
// as a parameter, since it names columns rather than supplying a value.
const MEMBER_COLUMNS = `id, kind, name, role, id_code as "idCode", email, access_level as "accessLevel", image`;

// Refuses to demote/delete the last admin — there'd be no account left able to reach the
// admin panel to undo it (the only other way back in is a local DB script).
async function wouldRemoveLastAdmin(id, kind) {
  const [target] = await sql`select access_level from members where id = ${id}::uuid and kind = ${kind}`;
  if (!target || target.access_level !== "admin") return false;
  const [{ count }] = await sql`select count(*)::int as count from members where access_level = 'admin'`;
  return count <= 1;
}

export default async function handler(req, res) {
  // Vercel's bracket catch-all ([...route].js) turned out not to reliably match more
  // than one path segment on this (non-framework) project, so the routing is done
  // explicitly instead: vercel.json rewrites /api/<anything> to
  // /api/router?path=<anything>, and the segments are split out here.
  const segments = String(req.query.path || "").split("/").filter(Boolean);
  const [resource, ...rest] = segments;
  try {
    switch (resource) {
      case "members":
        return await membersHandler(req, res, rest);
      case "moments":
        return await momentsHandler(req, res, rest);
      case "comments":
        return await commentsHandler(req, res, rest);
      case "briefings":
        return await briefingsHandler(req, res, rest);
      case "settings":
        return await settingsHandler(req, res, rest);
      case "schedule":
        return await scheduleHandler(req, res);
      default:
        return res.status(404).json({ error: "Not found" });
    }
  } catch (error) {
    console.error(`API xətası (${resource}):`, error);
    return res.status(500).json({ error: "Server xətası baş verdi." });
  }
}

// ---------- members (staff/crew/owner, one table distinguished by `kind`) ----------
// "owner" is a third kind for admin accounts the public homepage should never list — it
// only ever queries "staff" and "crew" (see src/pages/HomePage.jsx), so an "owner" row is
// invisible there by construction, not by filtering.
const MEMBER_KINDS = ["staff", "crew", "owner"];

async function membersHandler(req, res, [kind, id]) {
  if (!MEMBER_KINDS.includes(kind)) return res.status(400).json({ error: "kind staff, crew və ya owner olmalıdır." });

  if (req.method === "GET") {
    const rows = await sql`select ${sql.unsafe(MEMBER_COLUMNS)} from members where kind = ${kind} order by created_at desc`;
    return res.status(200).json(rows);
  }

  if (req.method === "POST") {
    if (!requireAdmin(req, res)) return;
    const { name, role, idCode, email, password, accessLevel } = req.body || {};
    if (!name || !role || !idCode || !email || !password) {
      return res.status(400).json({ error: "Bütün sahələr tələb olunur." });
    }
    const passwordHash = await hashPassword(password);
    const level = accessLevel === "admin" ? "admin" : "user";
    try {
      const [row] = await sql`
        insert into members (kind, name, role, id_code, email, password_hash, access_level)
        values (${kind}, ${name}, ${role}, ${idCode}, ${email}, ${passwordHash}, ${level})
        returning ${sql.unsafe(MEMBER_COLUMNS)}
      `;
      return res.status(201).json(row);
    } catch (error) {
      if (error.code === "23505") return res.status(409).json({ error: "Bu email artıq istifadə olunur." });
      throw error;
    }
  }

  if (req.method === "PATCH") {
    const user = requireAuth(req, res);
    if (!user) return;
    const isAdmin = user.accessLevel === "admin";
    const isSelf = user.id === id && user.kind === kind;
    const body = req.body || {};

    if (isAdmin) {
      const { name, role, idCode, email, accessLevel, image } = body;
      if (accessLevel && accessLevel !== "admin" && (await wouldRemoveLastAdmin(id, kind))) {
        return res.status(400).json({ error: "Sonuncu admin hesabını adi istifadəçiyə endirmək olmaz." });
      }
      const [row] = await sql`
        update members set
          name = coalesce(${name}, name),
          role = coalesce(${role}, role),
          id_code = coalesce(${idCode}, id_code),
          email = coalesce(${email}, email),
          access_level = coalesce(${accessLevel}, access_level),
          image = coalesce(${image}, image),
          updated_at = now()
        where id = ${id}::uuid and kind = ${kind}
        returning ${sql.unsafe(MEMBER_COLUMNS)}
      `;
      if (!row) return res.status(404).json({ error: "Üzv tapılmadı." });
      return res.status(200).json(row);
    }

    // A non-admin may only ever touch their own image — this is what stops a staff
    // member from granting themselves accessLevel: admin via a crafted request.
    if (isSelf && Object.keys(body).every((k) => k === "image")) {
      const [row] = await sql`
        update members set image = ${body.image}, updated_at = now() where id = ${id}::uuid and kind = ${kind}
        returning ${sql.unsafe(MEMBER_COLUMNS)}
      `;
      if (!row) return res.status(404).json({ error: "Üzv tapılmadı." });
      return res.status(200).json(row);
    }

    return res.status(403).json({ error: "Bu əməliyyat üçün icazəniz yoxdur." });
  }

  if (req.method === "DELETE") {
    if (!requireAdmin(req, res)) return;
    if (await wouldRemoveLastAdmin(id, kind)) {
      return res.status(400).json({ error: "Sonuncu admin hesabını silmək olmaz." });
    }
    const [row] = await sql`delete from members where id = ${id}::uuid and kind = ${kind} returning id`;
    if (!row) return res.status(404).json({ error: "Üzv tapılmadı." });
    return res.status(200).json({ success: true });
  }

  return res.status(405).json({ error: "Method not allowed" });
}

// ---------- moments ----------
async function momentsHandler(req, res, [id]) {
  if (req.method === "GET" && !id) {
    if (req.query.status === "approved") {
      if (!requireAuth(req, res)) return;
      const rows = await sql`
        select id, url, caption, status, liked_by as "likedBy", created_at as "createdAt"
        from approved_moments where status = 'approved' order by created_at desc
      `;
      return res.status(200).json(rows);
    }
    if (!requireAdmin(req, res)) return;
    const all = await sql`
      select id, url, caption, status, liked_by as "likedBy", created_at as "createdAt"
      from approved_moments order by created_at desc
    `;
    return res.status(200).json({
      pending: all.filter((m) => m.status === "pending"),
      approved: all.filter((m) => m.status === "approved"),
    });
  }

  if (req.method === "POST" && !id) {
    if (!requireAuth(req, res)) return;
    const { url, caption } = req.body || {};
    if (!url) return res.status(400).json({ error: "Video URL tələb olunur." });
    const [row] = await sql`
      insert into approved_moments (url, caption) values (${url}, ${caption || "Zara Ganjlik Moment"})
      returning id, url, caption, status, liked_by as "likedBy", created_at as "createdAt"
    `;
    return res.status(201).json(row);
  }

  if (req.method === "PATCH" && id) {
    const user = requireAuth(req, res);
    if (!user) return;
    const { action } = req.body || {};

    if (action === "approve") {
      if (user.accessLevel !== "admin") return res.status(403).json({ error: "Admin icazəsi tələb olunur." });
      const [row] = await sql`update approved_moments set status = 'approved' where id = ${id}::uuid returning id`;
      if (!row) return res.status(404).json({ error: "Tapılmadı." });
      return res.status(200).json({ success: true });
    }

    if (action === "like" || action === "unlike") {
      const [row] =
        action === "like"
          ? await sql`
              update approved_moments set liked_by = array_append(liked_by, ${user.id}::uuid)
              where id = ${id}::uuid and not (${user.id}::uuid = any(liked_by))
              returning liked_by as "likedBy"
            `
          : await sql`
              update approved_moments set liked_by = array_remove(liked_by, ${user.id}::uuid)
              where id = ${id}::uuid
              returning liked_by as "likedBy"
            `;
      if (!row) {
        const [existing] = await sql`select liked_by as "likedBy" from approved_moments where id = ${id}::uuid`;
        if (!existing) return res.status(404).json({ error: "Tapılmadı." });
        return res.status(200).json(existing);
      }
      return res.status(200).json(row);
    }

    return res.status(400).json({ error: "Naməlum əməliyyat." });
  }

  if (req.method === "DELETE" && id) {
    if (!requireAdmin(req, res)) return;
    const [row] = await sql`delete from approved_moments where id = ${id}::uuid returning id`;
    if (!row) return res.status(404).json({ error: "Tapılmadı." });
    return res.status(200).json({ success: true });
  }

  return res.status(405).json({ error: "Method not allowed" });
}

// ---------- comments ----------
async function commentsHandler(req, res, [id]) {
  if (req.method === "GET" && !id) {
    if (!requireAuth(req, res)) return;

    if (req.query.videoIds) {
      // Batched comment counts for the moments feed (one query instead of one per video).
      const ids = String(req.query.videoIds).split(",").filter(Boolean);
      const rows = ids.length
        ? await sql`select video_id as "videoId", count(*)::int as count from comments where video_id = any(${ids}::uuid[]) group by video_id`
        : [];
      const counts = Object.fromEntries(ids.map((vid) => [vid, 0]));
      rows.forEach((r) => (counts[r.videoId] = r.count));
      return res.status(200).json(counts);
    }

    if (!req.query.videoId) return res.status(400).json({ error: "videoId tələb olunur." });
    const rows = await sql`
      select id, video_id as "videoId", parent_id as "parentId", text,
             author_id as "authorUid", author_name as "authorName", author_image as "authorImage",
             created_at as "createdAt"
      from comments where video_id = ${req.query.videoId}::uuid order by created_at asc
    `;
    return res.status(200).json(rows);
  }

  if (req.method === "POST" && !id) {
    const user = requireAuth(req, res);
    if (!user) return;
    const { videoId, parentId, text } = req.body || {};
    if (!videoId || !text?.trim()) return res.status(400).json({ error: "videoId və mətn tələb olunur." });

    const [member] = await sql`select name, image from members where id = ${user.id}::uuid`;

    const [row] = await sql`
      insert into comments (video_id, parent_id, text, author_id, author_name, author_image)
      values (${videoId}::uuid, ${parentId || null}::uuid, ${text.trim()}, ${user.id}::uuid,
              ${member?.name || "Staff Member"}, ${member?.image || null})
      returning id, video_id as "videoId", parent_id as "parentId", text,
                author_id as "authorUid", author_name as "authorName", author_image as "authorImage",
                created_at as "createdAt"
    `;
    return res.status(201).json(row);
  }

  if (req.method === "DELETE" && id) {
    const user = requireAuth(req, res);
    if (!user) return;
    const [comment] = await sql`select author_id as "authorId" from comments where id = ${id}::uuid`;
    if (!comment) return res.status(404).json({ error: "Tapılmadı." });
    if (user.accessLevel !== "admin" && comment.authorId !== user.id) {
      return res.status(403).json({ error: "Bu şərhi silmək icazəniz yoxdur." });
    }
    // Replies cascade automatically (comments.parent_id has ON DELETE CASCADE).
    await sql`delete from comments where id = ${id}::uuid`;
    return res.status(200).json({ success: true });
  }

  return res.status(405).json({ error: "Method not allowed" });
}

// ---------- briefings ----------
async function briefingsHandler(req, res, [id]) {
  if (req.method === "GET") {
    if (!requireAuth(req, res)) return;
    if (id) {
      const [row] = await sql`select id, title, description, url, created_at as "createdAt" from briefings where id = ${id}::uuid`;
      if (!row) return res.status(404).json({ error: "Tapılmadı." });
      return res.status(200).json(row);
    }
    const rows = await sql`select id, title, description, url, created_at as "createdAt" from briefings order by created_at desc`;
    return res.status(200).json(rows);
  }

  if (req.method === "POST" && !id) {
    if (!requireAdmin(req, res)) return;
    const { title, description, url } = req.body || {};
    if (!title?.trim() || !url) return res.status(400).json({ error: "Başlıq və video tələb olunur." });
    const [row] = await sql`
      insert into briefings (title, description, url) values (${title.trim()}, ${description?.trim() || ""}, ${url})
      returning id, title, description, url, created_at as "createdAt"
    `;
    return res.status(201).json(row);
  }

  if (req.method === "DELETE" && id) {
    if (!requireAdmin(req, res)) return;
    const [row] = await sql`delete from briefings where id = ${id}::uuid returning id`;
    if (!row) return res.status(404).json({ error: "Tapılmadı." });
    return res.status(200).json({ success: true });
  }

  return res.status(405).json({ error: "Method not allowed" });
}

// ---------- settings (hero, energy) ----------
async function settingsHandler(req, res, [key]) {
  if (!key) return res.status(400).json({ error: "Settings key tələb olunur." });

  if (req.method === "GET") {
    const [row] = await sql`select value from settings where key = ${key}`;
    return res.status(200).json(row?.value ?? null);
  }

  if (req.method === "PUT") {
    if (!requireAdmin(req, res)) return;
    const value = req.body || {};
    const json = JSON.stringify(value);
    await sql`
      insert into settings (key, value) values (${key}, ${json}::jsonb)
      on conflict (key) do update set value = ${json}::jsonb, updated_at = now()
    `;
    return res.status(200).json(value);
  }

  return res.status(405).json({ error: "Method not allowed" });
}

// ---------- work schedule ----------
async function scheduleHandler(req, res) {
  if (req.method === "GET") {
    if (!requireAuth(req, res)) return;
    const [row] = await sql`select week_label as "weekLabel", by_employee as "byEmployee" from work_schedule where id = 'current'`;
    return res.status(200).json(row || null);
  }

  if (req.method === "PUT") {
    if (!requireAdmin(req, res)) return;
    const { weekLabel, byEmployee } = req.body || {};
    const json = JSON.stringify(byEmployee || {});
    await sql`
      insert into work_schedule (id, week_label, by_employee) values ('current', ${weekLabel || ""}, ${json}::jsonb)
      on conflict (id) do update set week_label = ${weekLabel || ""}, by_employee = ${json}::jsonb, uploaded_at = now()
    `;
    return res.status(200).json({ success: true });
  }

  return res.status(405).json({ error: "Method not allowed" });
}
