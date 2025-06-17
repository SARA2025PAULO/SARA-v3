"use client";
// src/components/properties/BulkUploadModal.tsx

import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext'; // Hook for context
import { auth } from '@/lib/firebase'; // Firebase Auth instance

interface BulkUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUploadSuccess: () => void;
}

const BulkUploadModal: React.FC<BulkUploadModalProps> = ({
  isOpen,
  onClose,
  onUploadSuccess,
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [uploadResult, setUploadResult] = useState<any>(null);

  const { currentUser } = useAuth();

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setSelectedFile(e.target.files[0]);
      setIsLoading(false);
      setUploadResult(null);
    } else {
      setSelectedFile(null);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      alert('Por favor, selecciona un archivo primero.');
      return;
    }

    const user = auth.currentUser;
    if (!user) {
      setUploadResult({
        error: 'Error de autenticación.',
        details: 'No hay un usuario autenticado.',
      });
      return;
    }

    setIsLoading(true);
    setUploadResult(null);

    try {
      const idToken = await user.getIdToken();

      const formData = new FormData();
      formData.append('properties_file', selectedFile);

      console.log('Uploading file:', selectedFile.name);
      const response = await fetch(
        'https://us-central1-sara3o.cloudfunctions.net/uploadProperties',
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${idToken}`,
          },
          body: formData,
        }
      );

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Error en la respuesta del servidor');
      }

      setUploadResult(data);
      onUploadSuccess();
    } catch (err: any) {
      console.error('Upload failed:', err);
      setUploadResult({
        error: 'Error durante la carga.',
        details: err.message || err,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md">
        <h2 className="text-xl font-bold mb-4">Carga Masiva de Propiedades</h2>
        <p className="mb-4">
          Selecciona un archivo CSV o Excel (.xlsx, .xls) con los datos de las
          propiedades.
        </p>

        <p className="mb-4">
          <a
            href="/template_propiedades.csv"
            download="template_propiedades.csv"
            className="text-blue-600 hover:underline"
          >
            Descargar Plantilla CSV
          </a>
        </p>

        <div className="mb-4">
          <input
            type="file"
            accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel"
            onChange={handleFileChange}
          />
          {selectedFile && (
            <p className="mt-2 text-sm text-gray-600">
              Archivo seleccionado: {selectedFile.name}
            </p>
          )}
        </div>

        <button
          onClick={handleUpload}
          disabled={!selectedFile || isLoading}
          className={`w-full px-4 py-2 text-white rounded ${
            !selectedFile || isLoading
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-blue-600 hover:bg-blue-700'
          }`}
        >
          {isLoading ? 'Cargando...' : 'Subir Archivo'}
        </button>

        <div className="mt-4">
          {isLoading && <p>Procesando carga...</p>}

          {uploadResult?.message && (
            <div className="text-green-600">
              <h3 className="font-semibold">Resultado de la Carga:</h3>
              <p>{uploadResult.message}</p>
              {uploadResult.processedResults && (
                <>
                  <p>
                    Total filas procesadas:{' '}
                    {uploadResult.processedResults.successCount +
                      uploadResult.processedResults.errorCount}
                  </p>
                  <p>
                    Propiedades creadas con éxito:{' '}
                    {uploadResult.processedResults.successCount}
                  </p>
                  {uploadResult.processedResults.errorCount > 0 && (
                    <div>
                      <p className="text-red-600 font-semibold">
                        Errores encontrados:{' '}
                        {uploadResult.processedResults.errorCount}
                      </p>
                      <ul className="list-disc list-inside text-red-600 text-sm">
                        {uploadResult.processedResults.errors.map(
                          (err: any, idx: number) => (
                            <li key={idx}>
                              Fila {err.row}: {err.errors.join(', ')}
                            </li>
                          )
                        )}
                      </ul>
                    </div>
                  )}
                </>
              )}
          </div>
          )}

          {uploadResult?.error && (
            <div className="text-red-600">
              <p className="font-semibold">Error durante la carga:</p>
              <p>{uploadResult.details || uploadResult.error}</p>
            </div>
          )}
        </div>

        <button
          onClick={onClose}
          className="mt-6 w-full px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
        >
          Cerrar
        </button>
      </div>
    </div>
  );
};

export default BulkUploadModal;
