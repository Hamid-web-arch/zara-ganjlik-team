import { useEffect, useRef, useState } from "react";
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
} from "firebase/firestore";
import { createAuthAccountWithoutSignIn, db } from "../lib/firebase";

const DEFAULT_AVATAR =
  "https://upload.wikimedia.org/wikipedia/commons/7/7c/Profile_avatar_placeholder_large.png";

const EMPTY_FORM = { name: "", role: "", idCode: "", email: "", password: "", accessLevel: "user" };

export default function MemberSection({ collectionName, heading, entityName }) {
  const [members, setMembers] = useState([]);
  const [form, setForm] = useState(EMPTY_FORM);
  const [editId, setEditId] = useState(null);
  const [saving, setSaving] = useState(false);
  const formRef = useRef(null);

  useEffect(() => {
    const q = query(collection(db, collectionName), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setMembers(snapshot.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() })));
    });
    return () => unsubscribe();
  }, [collectionName]);

  const handleChange = (field) => (e) => setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const handleEdit = async (id) => {
    const docSnap = await getDoc(doc(db, collectionName, id));
    if (!docSnap.exists()) return;
    const d = docSnap.data();
    setForm({
      name: d.name || "",
      role: d.role || "",
      idCode: d.idCode || "",
      email: d.email || "",
      password: "",
      accessLevel: d.accessLevel || "user",
    });
    setEditId(id);
    formRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleDelete = async (id) => {
    if (!confirm(`Bu ${entityName.toLowerCase()} üzvünü silmək istəyirsiniz?`)) return;
    try {
      await deleteDoc(doc(db, collectionName, id));
      alert(
        `${entityName} bazadan silindi. QEYD: İstifadəçinin giriş icazəsini (Auth) Firebase konsolundan da əllə silməyi unutmayın.`
      );
    } catch (error) {
      alert("Silinmə xətası: " + error.message);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      if (editId) {
        const existing = members.find((m) => m.id === editId);
        const data = {
          name: form.name,
          role: form.role,
          idCode: form.idCode,
          email: form.email,
          accessLevel: form.accessLevel,
          image: existing?.image || DEFAULT_AVATAR,
          updatedAt: serverTimestamp(),
        };
        await updateDoc(doc(db, collectionName, editId), data);
        alert(`${entityName} məlumatları uğurla yeniləndi!`);
      } else {
        if (!form.password) {
          alert(`Yeni ${entityName.toLowerCase()} üçün şifrə tələb olunur!`);
          setSaving(false);
          return;
        }

        const uid = await createAuthAccountWithoutSignIn(form.email, form.password);

        const data = {
          name: form.name,
          role: form.role,
          idCode: form.idCode,
          email: form.email,
          accessLevel: form.accessLevel,
          image: DEFAULT_AVATAR,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        };

        try {
          await setDoc(doc(db, collectionName, uid), data);
        } catch (profileError) {
          console.error("Profil yaradılarkən xəta:", profileError);
          alert(
            `Diqqət: Giriş hesabı yaradıldı (UID: ${uid}), lakin profil bazaya yazıla bilmədi: ${profileError.message}\n\n` +
              `Firebase konsolundan bu UID-li istifadəçini əl ilə silin, sonra yenidən cəhd edin.`
          );
          setSaving(false);
          return;
        }

        alert(`${entityName} üzvü uğurla əlavə olundu!`);
      }

      setForm(EMPTY_FORM);
      setEditId(null);
    } catch (error) {
      console.error("Firebase xətası:", error);
      alert("Xəta baş verdi: " + error.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="glass p-4 md:p-8 rounded-sm">
      <h2 className="font-sync text-xl font-bold tracking-tighter mb-8 text-white">{heading}</h2>

      <form
        ref={formRef}
        onSubmit={handleSubmit}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4 mb-10"
      >
        <input
          type="text"
          placeholder="NAME"
          required
          value={form.name}
          onChange={handleChange("name")}
          className="bg-transparent border-b border-white/10 py-3 text-[10px] tracking-[0.2em] outline-none focus:border-white text-white uppercase"
        />
        <input
          type="text"
          placeholder="ROLE"
          required
          value={form.role}
          onChange={handleChange("role")}
          className="bg-transparent border-b border-white/10 py-3 text-[10px] tracking-[0.2em] outline-none focus:border-white text-white uppercase"
        />
        <input
          type="text"
          placeholder="ID CODE"
          required
          value={form.idCode}
          onChange={handleChange("idCode")}
          className="bg-transparent border-b border-white/10 py-3 text-[10px] tracking-[0.2em] outline-none focus:border-white text-white uppercase"
        />
        <input
          type="email"
          placeholder="EMAIL"
          required
          value={form.email}
          onChange={handleChange("email")}
          className="bg-transparent border-b border-white/10 py-3 text-[10px] tracking-[0.2em] outline-none focus:border-white text-white uppercase"
        />
        <input
          type="password"
          placeholder="PASSWORD"
          value={form.password}
          onChange={handleChange("password")}
          className="bg-transparent border-b border-white/10 py-3 text-[10px] tracking-[0.2em] outline-none focus:border-white text-white"
        />
        <div className="relative border-b border-white/10 focus-within:border-white">
          <select
            required
            value={form.accessLevel}
            onChange={handleChange("accessLevel")}
            className="w-full bg-transparent py-3 text-[10px] tracking-[0.2em] text-white/50 outline-none appearance-none cursor-pointer uppercase font-light"
          >
            <option value="user" className="bg-zinc-900 text-white">
              User (Staff)
            </option>
            <option value="admin" className="bg-zinc-900 text-white">
              Admin (Full Access)
            </option>
          </select>
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2 text-white/30 text-[8px]">
            ▼
          </div>
        </div>

        <button
          type="submit"
          disabled={saving}
          className="border border-white/20 py-3 text-[9px] uppercase tracking-[0.4em] hover:bg-white hover:text-black transition-all md:col-span-2 lg:col-span-6 mt-2 disabled:opacity-40"
        >
          {saving ? "SAVING..." : editId ? `UPDATE ${entityName.toUpperCase()}` : `Add ${entityName}`}
        </button>
      </form>

      {/* Mobile: stacked cards — a fixed-layout table can't shrink to a narrow screen without
          truncating every column, so below md this renders as cards instead. */}
      <div className="md:hidden space-y-3 max-h-[400px] overflow-y-auto">
        {members.map((m) => (
          <div key={m.id} className="border border-white/10 rounded-sm p-4 space-y-3">
            <div className="flex items-center gap-3">
              <img src={m.image || DEFAULT_AVATAR} className="w-10 h-10 object-cover rounded-full shrink-0" alt="" />
              <div className="min-w-0">
                <p className="text-[11px] text-white truncate">{m.name}</p>
                <p className="text-[9px] text-white/40 truncate">
                  {m.role}
                  {m.accessLevel === "admin" && <span className="text-blue-500"> [ADMIN]</span>}
                </p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2 text-[9px] text-white/40">
              <div>
                <span className="block text-[8px] uppercase tracking-widest text-white/20">ID</span>
                {m.idCode || "-"}
              </div>
              <div className="min-w-0">
                <span className="block text-[8px] uppercase tracking-widest text-white/20">Email</span>
                <span className="truncate block">{m.email || "-"}</span>
              </div>
            </div>
            <div className="flex justify-end gap-4 pt-2 border-t border-white/5">
              <button onClick={() => handleEdit(m.id)} className="text-[9px] text-blue-500">
                [ EDIT ]
              </button>
              <button onClick={() => handleDelete(m.id)} className="text-[9px] text-red-500">
                [ REMOVE ]
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Desktop/tablet: table */}
      <div className="hidden md:block max-h-[300px] overflow-y-auto overflow-x-auto">
        <table className="w-full text-left" style={{ tableLayout: "fixed", borderCollapse: "collapse" }}>
          <thead className="sticky top-0 bg-zinc-900">
            <tr className="border-b border-white/10 text-[8px] uppercase tracking-[0.4em] text-white/30">
              <th className="pb-4 w-[25%]">Member</th>
              <th className="pb-4 w-[20%]">Role</th>
              <th className="pb-4 w-[15%]">ID</th>
              <th className="pb-4 w-[25%]">Email</th>
              <th className="pb-4 w-[15%] text-right pr-6">Actions</th>
            </tr>
          </thead>
          <tbody>
            {members.map((m) => (
              <tr key={m.id} className="group border-b border-white/5 hover:bg-white/[0.02]">
                <td className="py-4 flex items-center gap-3">
                  <img src={m.image || DEFAULT_AVATAR} className="w-10 h-10 object-cover rounded-full" alt="" />
                  <span className="text-[10px] text-white">{m.name}</span>
                </td>
                <td className="py-4 text-[9px] text-white/40">
                  {m.role}
                  {m.accessLevel === "admin" && <span className="text-blue-500 text-[8px]"> [ADMIN]</span>}
                </td>
                <td className="py-4 text-[9px] text-white/40">{m.idCode || "-"}</td>
                <td className="py-4 text-[9px] text-white/40">{m.email || "-"}</td>
                <td className="py-4 text-right space-x-2 pr-6">
                  <button onClick={() => handleEdit(m.id)} className="text-[8px] text-blue-500">
                    [ EDIT ]
                  </button>
                  <button onClick={() => handleDelete(m.id)} className="text-[8px] text-red-500">
                    [ REMOVE ]
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
