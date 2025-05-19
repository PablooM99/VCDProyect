// src/components/GestionContenidoAdmin.jsx
import React, { useState, useEffect } from 'react';
import { db, storage } from '../firebase/config';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, listAll, deleteObject } from 'firebase/storage';

const GestionContenidoAdmin = () => {
  const [homeTitle, setHomeTitle] = useState('');
  const [homeDescription, setHomeDescription] = useState('');
  const [bannerURL, setBannerURL] = useState('');
  const [bannerFile, setBannerFile] = useState(null);
  const [marcasURLs, setMarcasURLs] = useState([]);
  const [marcasFiles, setMarcasFiles] = useState([]);
  const [footerText, setFooterText] = useState('');
  const [whatsappLink, setWhatsappLink] = useState('');
  const [portfolioLink, setPortfolioLink] = useState('');
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
          setFooterText(data.footerText || '');
          setWhatsappLink(data.whatsappLink || '');
          setPortfolioLink(data.portfolioLink || '');
        }
      } catch (error) {
        console.error('Error al obtener el contenido del sitio:', error);
      }
    };

    fetchContent();
  }, []);

  const handleBannerUpload = async () => {
    if (!bannerFile) return bannerURL;

    const storageRef = ref(storage, `banners/${bannerFile.name}`);
    await uploadBytes(storageRef, bannerFile);
    const url = await getDownloadURL(storageRef);

    // Mantener solo las dos últimas versiones
    const listRef = ref(storage, 'banners/');
    const res = await listAll(listRef);
    if (res.items.length > 2) {
      // Ordenar por fecha de creación (no disponible directamente, se puede implementar si se guarda metadata)
      // Aquí se elimina el primero arbitrariamente
      await deleteObject(res.items[0]);
    }

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

    // Mantener solo las dos últimas versiones
    const listRef = ref(storage, 'marcas/');
    const res = await listAll(listRef);
    if (res.items.length > 2) {
      // Ordenar por fecha de creación (no disponible directamente, se puede implementar si se guarda metadata)
      // Aquí se elimina el primero arbitrariamente
      await deleteObject(res.items[0]);
    }

    return urls;
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const newBannerURL = await handleBannerUpload();
      const newMarcasURLs = await handleMarcasUpload();

      const docRef = doc(db, 'contenidoSitio', 'general');
      await setDoc(docRef, {
        homeTitle,
        homeDescription,
        bannerURL: newBannerURL,
        marcasURLs: newMarcasURLs,
        footerText,
        whatsappLink,
        portfolioLink,
      });

      alert('Contenido actualizado correctamente.');
    } catch (error) {
      console.error('Error al guardar el contenido del sitio:', error);
      alert('Hubo un error al guardar el contenido.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 md:p-8 text-white bg-gray-950 min-h-screen">
      <h1 className="text-2xl font-bold text-amber-400 mb-6">
        🛠️ Gestión de Contenido del Sitio
      </h1>

      <div className="mb-4">
        <label className="block mb-2">Título de la Home:</label>
        <input
          type="text"
          value={homeTitle}
          onChange={(e) => setHomeTitle(e.target.value)}
          className="w-full p-2 rounded bg-gray-800 text-white"
        />
      </div>

      <div className="mb-4">
        <label className="block mb-2">Descripción de la Home:</label>
        <textarea
          value={homeDescription}
          onChange={(e) => setHomeDescription(e.target.value)}
          className="w-full p-2 rounded bg-gray-800 text-white"
        />
      </div>

      <div className="mb-4">
        <label className="block mb-2">Banner Principal:</label>
        <input
          type="file"
          accept="image/*"
          onChange={(e) => setBannerFile(e.target.files[0])}
          className="mb-2"
        />
        <input
          type="text"
          placeholder="O ingresa una URL de imagen"
          value={bannerURL}
          onChange={(e) => setBannerURL(e.target.value)}
          className="w-full p-2 rounded bg-gray-800 text-white"
        />
        {bannerURL && (
          <img src={bannerURL} alt="Banner" className="mt-2 w-full h-48 object-cover" />
        )}
      </div>

      <div className="mb-4">
        <label className="block mb-2">Marcas Destacadas:</label>
        <input
          type="file"
          accept="image/*"
          multiple
          onChange={(e) => setMarcasFiles(Array.from(e.target.files))}
          className="mb-2"
        />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {marcasURLs.map((url, index) => (
            <img key={index} src={url} alt={`Marca ${index}`} className="w-full h-24 object-contain" />
          ))}
        </div>
      </div>

      <div className="mb-4">
        <label className="block mb-2">Texto del Footer:</label>
        <input
          type="text"
          value={footerText}
          onChange={(e) => setFooterText(e.target.value)}
          className="w-full p-2 rounded bg-gray-800 text-white"
        />
      </div>

      <div className="mb-4">
        <label className="block mb-2">Enlace de WhatsApp:</label>
        <input
          type="text"
          value={whatsappLink}
          onChange={(e) => setWhatsappLink(e.target.value)}
          className="w-full p-2 rounded bg-gray-800 text-white"
        />
      </div>

      <div className="mb-4">
        <label className="block mb-2">Enlace de Portafolio:</label>
        <input
          type="text"
          value={portfolioLink}
          onChange={(e) => setPortfolioLink(e.target.value)}
          className="w-full p-2 rounded bg-gray-800 text-white"
        />
      </div>

      <button
        onClick={handleSave}
        disabled={loading}
        className="bg-amber-500 hover:bg-amber-600 px-4 py-2 rounded text-black"
      >
        {loading ? 'Guardando...' : 'Guardar Cambios'}
      </button>
    </div>
  );
};

export default GestionContenidoAdmin;
