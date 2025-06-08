
"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { db, storage } from '@/lib/firebase';
import { ref, uploadBytesResumable, getDownloadURL, deleteObject } from "firebase/storage";
import { collection, addDoc, query, where, getDocs, serverTimestamp, doc, deleteDoc, orderBy, Timestamp } from "firebase/firestore";
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import type { UploadedFile } from '@/types';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { UploadCloud, File as FileIcon, Download, Trash2, AlertCircle, Loader2 } from 'lucide-react';
import Link from 'next/link';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export function FileUploadManager() {
  const { currentUser } = useAuth();
  const { toast } = useToast();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [isLoadingFiles, setIsLoadingFiles] = useState(true);
  const [fileToDelete, setFileToDelete] = useState<UploadedFile | null>(null);

  const fetchUserFiles = useCallback(async () => {
    if (!currentUser || !db) {
      setUploadedFiles([]);
      setIsLoadingFiles(false);
      return;
    }
    setIsLoadingFiles(true);
    try {
      const q = query(collection(db, "userFiles"), where("userId", "==", currentUser.uid), orderBy("uploadedAt", "desc"));
      const querySnapshot = await getDocs(q);
      const files = querySnapshot.docs.map(docSnap => {
        const data = docSnap.data();
        return {
          id: docSnap.id,
          ...data,
          uploadedAt: (data.uploadedAt as Timestamp)?.toDate().toISOString() || new Date().toISOString(),
        } as UploadedFile;
      });
      setUploadedFiles(files);
    } catch (error) {
      console.error("Error fetching files:", error);
      toast({ title: "Error al cargar archivos", description: "No se pudieron obtener tus archivos.", variant: "destructive" });
    } finally {
      setIsLoadingFiles(false);
    }
  }, [currentUser, toast]);

  useEffect(() => {
    fetchUserFiles();
  }, [fetchUserFiles]);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setSelectedFile(event.target.files[0]);
    } else {
      setSelectedFile(null);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile || !currentUser || !storage || !db) {
      toast({ title: "Error", description: "No se seleccionó archivo o falta información del usuario.", variant: "destructive" });
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    const storagePath = `uploads/${currentUser.uid}/${selectedFile.name}`;
    const storageRef = ref(storage, storagePath);
    const uploadTask = uploadBytesResumable(storageRef, selectedFile);

    uploadTask.on('state_changed',
      (snapshot) => {
        const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        setUploadProgress(progress);
      },
      (error) => {
        console.error("Upload error:", error);
        toast({ title: "Error de Subida", description: `No se pudo subir el archivo: ${error.message}`, variant: "destructive" });
        setIsUploading(false);
        setUploadProgress(0);
        setSelectedFile(null);
      },
      async () => {
        try {
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
          const fileMetadata: Omit<UploadedFile, 'id' | 'uploadedAt'> & { uploadedAt: any } = {
            userId: currentUser.uid,
            fileName: selectedFile.name,
            downloadURL,
            storagePath,
            contentType: selectedFile.type,
            size: selectedFile.size,
            uploadedAt: serverTimestamp(),
          };
          await addDoc(collection(db, "userFiles"), fileMetadata);
          toast({ title: "Archivo Subido", description: `${selectedFile.name} se ha subido correctamente.` });
          fetchUserFiles(); // Refresh the list
        } catch (error) {
          console.error("Error saving file metadata to Firestore:", error);
          toast({ title: "Error de Guardado", description: "El archivo se subió pero no se pudo guardar la referencia.", variant: "destructive" });
        } finally {
          setIsUploading(false);
          setUploadProgress(0);
          setSelectedFile(null);
          // Clear the file input
          const fileInput = document.getElementById('file-upload-input') as HTMLInputElement;
          if (fileInput) fileInput.value = '';
        }
      }
    );
  };

  const handleDeleteFile = async () => {
    if (!fileToDelete || !currentUser || !storage || !db) {
      toast({ title: "Error", description: "No se pudo eliminar el archivo.", variant: "destructive" });
      return;
    }
    
    try {
      // Delete from Storage
      const fileStorageRef = ref(storage, fileToDelete.storagePath);
      await deleteObject(fileStorageRef);

      // Delete from Firestore
      await deleteDoc(doc(db, "userFiles", fileToDelete.id));

      toast({ title: "Archivo Eliminado", description: `${fileToDelete.fileName} ha sido eliminado.` });
      setUploadedFiles(prevFiles => prevFiles.filter(f => f.id !== fileToDelete.id));
    } catch (error) {
      console.error("Error deleting file:", error);
      toast({ title: "Error al Eliminar", description: `No se pudo eliminar el archivo: ${(error as Error).message}`, variant: "destructive" });
    } finally {
      setFileToDelete(null);
    }
  };
  
  const formatFileSize = (bytes?: number) => {
    if (bytes === undefined || bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="space-y-8">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center"><UploadCloud className="mr-2 h-6 w-6 text-primary" />Subir Nuevo Archivo</CardTitle>
          <CardDescription>Selecciona un archivo de tu dispositivo para guardarlo en S.A.R.A.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input id="file-upload-input" type="file" onChange={handleFileSelect} className="file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20" disabled={isUploading}/>
          {selectedFile && !isUploading && (
            <p className="text-sm text-muted-foreground">Archivo seleccionado: {selectedFile.name} ({formatFileSize(selectedFile.size)})</p>
          )}
          {isUploading && (
            <div className="space-y-1">
              <Progress value={uploadProgress} className="w-full h-3" />
              <p className="text-sm text-muted-foreground text-center">{uploadProgress.toFixed(0)}% completado</p>
            </div>
          )}
        </CardContent>
        <CardFooter>
          <Button onClick={handleUpload} disabled={!selectedFile || isUploading}>
            {isUploading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Subiendo...</> : <> <UploadCloud className="mr-2 h-4 w-4" /> Subir Archivo</>}
          </Button>
        </CardFooter>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Mis Archivos Subidos</CardTitle>
          <CardDescription>Aquí puedes ver y gestionar los archivos que has subido.</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoadingFiles ? (
            <div className="flex justify-center items-center py-8">
              <Loader2 className="mr-2 h-8 w-8 animate-spin text-primary" />
              <p>Cargando tus archivos...</p>
            </div>
          ) : uploadedFiles.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground">
              <FileIcon className="mx-auto h-12 w-12 mb-4" />
              <p className="text-lg">No has subido ningún archivo todavía.</p>
              <p className="text-sm">Usa el formulario de arriba para empezar a subir archivos.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[50px]">Tipo</TableHead>
                    <TableHead>Nombre del Archivo</TableHead>
                    <TableHead>Tamaño</TableHead>
                    <TableHead>Fecha de Subida</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {uploadedFiles.map((file) => (
                    <TableRow key={file.id}>
                      <TableCell><FileIcon className="h-5 w-5 text-muted-foreground" /></TableCell>
                      <TableCell className="font-medium break-all">{file.fileName}</TableCell>
                      <TableCell>{formatFileSize(file.size)}</TableCell>
                      <TableCell>{new Date(file.uploadedAt).toLocaleDateString('es-CL')}</TableCell>
                      <TableCell className="text-right space-x-2">
                        <Button variant="outline" size="sm" asChild>
                          <Link href={file.downloadURL} target="_blank" download={file.fileName}>
                            <Download className="h-4 w-4 mr-1" /> Descargar
                          </Link>
                        </Button>
                        <AlertDialogTrigger asChild>
                           <Button variant="destructive" size="sm" onClick={() => setFileToDelete(file)}>
                            <Trash2 className="h-4 w-4 mr-1" /> Eliminar
                          </Button>
                        </AlertDialogTrigger>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
      
      <AlertDialog open={!!fileToDelete} onOpenChange={(open) => !open && setFileToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center"><AlertCircle className="mr-2 h-5 w-5 text-destructive"/>¿Estás seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Esto eliminará permanentemente el archivo <span className="font-semibold">{fileToDelete?.fileName}</span> de nuestros servidores.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setFileToDelete(null)}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteFile} className="bg-destructive hover:bg-destructive/90 text-destructive-foreground">
              Sí, eliminar archivo
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

