// src/components/GestionContenidoAdmin.jsx
import React, { useState, useEffect } from 'react';
import { db, storage } from '../firebase/config';
import { doc, getDoc, setDoc, updateDoc, collection, getDocs } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

const GestionContenidoAdmin = () => {
  const [homeTitle, setHomeTitle] = useState('');
  const [homeDescription, setHomeDescription] = useState('');
  const [bannerURL, setBannerURL] = useState('');
  const [bannerFile, setBannerFile] = useState(null);

  const [marcasURLs, setMarcasURLs] = useState([]);
  const [marcaURLInput, setMarcaURLInput] = useState('');
  const [marcasFiles, setMarcasFiles] = useState([]);

  const [productos, setProductos] = useState([]);
  const [busquedaProducto, setBusquedaProducto] = useState('');
  const [destacados, setDestacados] = useState([]);

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchContent = async () => {
      try {
        const docRef = doc(db, 'contenidoSitio', 'general');
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          setHomeTitle(data.homeTitle || '');
          setHomeDescription(data.homeDescription || '');
          setBannerURL(data.bannerURL || '');
          setMarcasURLs(data.marcasURLs || []);
          setDestacados(data.destacados || []);
        }

        const snap = await getDocs(collection(db, 'productos'));
        const lista = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        setProductos(lista);
      } catch (error) {
        console.error('Error al obtener datos:', error);
      }
    };

    fetchContent();
  }, []);

  const handleBannerUpload = async () => {
    if (!bannerFile) return bannerURL;
    const storageRef = ref(storage, `banners/${bannerFile.name}`);
    await uploadBytes(storageRef, bannerFile);
    const url = await getDownloadURL(storageRef);
    return url;
  };

  const handleMarcasUpload = async () => {
    const urls = [...marcasURLs];
    for (const file of marcasFiles) {
      const storageRef = ref(storage, `marcas/${file.name}`);
      await uploadBytes(storageRef, file);
      const url = await getDownloadURL(storageRef);
      urls.push(url);
    }
    return urls;
  };

  const agregarMarcaPorURL = () => {
    const urls = marcaURLInput
      .split(';')
      .map((u) => u.trim())
      .filter((u) => u.startsWith('http'));

    if (urls.length > 0) {
      setMarcasURLs((prev) => [...prev, ...urls]);
      setMarcaURLInput('');
    }
  };

  const eliminarMarca = (url) => {
    setMarcasURLs(marcasURLs.filter((u) => u !== url));
  };

  const agregarDestacado = (id) => {
    if (!destacados.includes(id)) setDestacados([...destacados, id]);
  };

  const quitarDestacado = (id) => {
    setDestacados(destacados.filter((d) => d !== id));
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const docRef = doc(db, 'contenidoSitio', 'general');
      const docSnap = await getDoc(docRef);

      const newBannerURL = await handleBannerUpload();
      const nuevasMarcas = await handleMarcasUpload();

      const nuevosCampos = {
        ...(homeTitle && { homeTitle }),
        ...(homeDescription && { homeDescription }),
        ...(newBannerURL && { bannerURL: newBannerURL }),
        ...(nuevasMarcas.length > 0 && { marcasURLs: nuevasMarcas }),
        destacados,
      };

      if (docSnap.exists()) {
        await updateDoc(docRef, nuevosCampos);
      } else {
        await setDoc(docRef, nuevosCampos);
      }

      alert('Contenido guardado correctamente.');
    } catch (error) {
      console.error('Error al guardar:', error);
      alert('Hubo un error al guardar.');
    } finally {
      setLoading(false);
    }
  };

  const productosFiltrados = productos.filter((p) =>
    busquedaProducto.toLowerCase().split(" ").every(palabra =>
      p.title?.toLowerCase().includes(palabra) || p.id.includes(palabra)
    )
  );

  return (
    <div className="p-4 md:p-8 text-white bg-gray-950 min-h-screen">
      <h1 className="text-2xl font-bold text-amber-400 mb-6">🛠️ Gestión de Contenido</h1>

      {/* Título y descripción Home */}
      <div className="mb-4">
        <label className="block mb-2">🏠 Título de la Home</label>
        <input type="text" value={homeTitle} onChange={(e) => setHomeTitle(e.target.value)} className="w-full p-2 rounded bg-gray-800 text-white" />
      </div>

      <div className="mb-4">
        <label className="block mb-2">📜 Descripción</label>
        <textarea value={homeDescription} onChange={(e) => setHomeDescription(e.target.value)} className="w-full p-2 rounded bg-gray-800 text-white" />
      </div>

      {/* Banner */}
      <div className="mb-4">
        <label className="block mb-2">🖼 Banner Principal</label>
        <input type="file" accept="image/*" onChange={(e) => setBannerFile(e.target.files[0])} className="mb-2" />
        <input type="text" placeholder="O ingresa una URL" value={bannerURL} onChange={(e) => setBannerURL(e.target.value)} className="w-full p-2 rounded bg-gray-800 text-white" />
        {bannerURL && <img src={bannerURL} className="w-full h-48 object-cover mt-2" />}
      </div>

      {/* Marcas destacadas */}
      <div className="mb-4">
        <label className="block mb-2">🏷 Marcas Destacadas</label>
        <input type="file" accept="image/*" multiple onChange={(e) => setMarcasFiles(Array.from(e.target.files))} className="mb-2" />
        <input type="text" placeholder="Agregar marcas por URL separadas por ;" value={marcaURLInput} onChange={(e) => setMarcaURLInput(e.target.value)} className="bg-gray-800 text-white p-2 rounded mb-2 w-full" />
        <button onClick={agregarMarcaPorURL} className="bg-blue-600 hover:bg-blue-700 px-3 py-1 rounded mb-4">
          Agregar Marcas por URL
        </button>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {marcasURLs.map((url, i) => (
            <div key={i} className="relative">
              <img
                src={url}
                onError={(e) => (e.target.src = "https://via.placeholder.com/150")}
                className="w-full h-24 object-contain bg-white"
              />
              <button
                onClick={() => eliminarMarca(url)}
                className="absolute top-1 right-1 bg-red-600 hover:bg-red-700 text-sm px-2 py-0.5 rounded"
              >
                X
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Productos destacados */}
      <div className="mb-6">
        <label className="block mb-2">⭐ Productos Destacados</label>
        <input type="text" placeholder="Buscar por título o ID..." value={busquedaProducto} onChange={(e) => setBusquedaProducto(e.target.value)} className="w-full p-2 rounded bg-gray-800 text-white mb-4" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 max-h-64 overflow-y-auto">
          {productosFiltrados.map((p) => (
            <div key={p.id} className="flex items-center gap-3 bg-gray-800 p-2 rounded">
              <img src={p.imageURLs?.[0] || p.imageURL || "https://via.placeholder.com/40"} className="w-12 h-12 object-contain bg-white rounded" />
              <div className="flex-1 text-sm">
                <p className="font-bold">{p.title}</p>
                <p className="text-xs">{p.id}</p>
              </div>
              <button onClick={() => agregarDestacado(p.id)} className="bg-green-600 px-2 py-1 rounded text-xs">Agregar</button>
            </div>
          ))}
        </div>

        <h3 className="text-lg font-semibold mt-6 mb-2">Productos Destacados Actuales</h3>
        <ul className="space-y-1">
          {destacados.map((id) => {
            const prod = productos.find(p => p.id === id);
            return (
              <li key={id} className="bg-gray-700 p-2 rounded flex justify-between items-center">
                <span>{prod?.title || id}</span>
                <button onClick={() => quitarDestacado(id)} className="text-red-400 hover:underline text-sm">Eliminar</button>
              </li>
            );
          })}
        </ul>
      </div>

      <button onClick={handleSave} disabled={loading} className="bg-amber-500 hover:bg-amber-600 px-4 py-2 rounded text-black">
        {loading ? 'Guardando...' : 'Guardar Cambios'}
      </button>
    </div>
  );
};

export default GestionContenidoAdmin;
