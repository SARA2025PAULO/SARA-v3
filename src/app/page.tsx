'use client';

import React from 'react';
import { motion } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link'; // Importar Link para la navegación
import {
  Save,
  Bell,
  CheckCircle,
  Mail,
  Lock,
  User,
  PlusCircle,
  Facebook,
  Twitter,
  Linkedin,
  ShieldCheck, // Icono para la frase destacada
  AlertTriangle, // Icono para Gestión de incidentes
} from 'lucide-react';

// Componente de botón actualizado para usar una imagen como CTA
const ImageButton = ({ src, alt, className, width, height }: { src: string; alt: string; className?: string; width: number; height: number; }) => (
  <Link href="/login" passHref>
    <motion.div
      className={`relative cursor-pointer inline-block ${className}`}
      whileHover={{ scale: 1.05, filter: 'brightness(1.1)' }}
      whileTap={{ scale: 0.95 }}
      transition={{ type: 'spring', stiffness: 400, damping: 17 }}
    >
      <Image src={src} alt={alt} width={width} height={height} />
    </motion.div>
  </Link>
);

const LandingPage = () => {
  return (
    <div className="min-h-screen bg-sara-background text-sara-text overflow-hidden">
      {/* Header */}
      <motion.header
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="fixed top-0 left-0 right-0 z-50 bg-sara-white shadow-md py-4 px-8 flex justify-between items-center"
      >
        <div className="flex items-center space-x-2">
          <Image src="/Images/logo.png" alt="S.A.R.A. Logo" width={100} height={40} priority />
        </div>
        <nav className="hidden md:flex items-center space-x-8">
          <a href="#hero" className="flex flex-col items-center text-sara-text hover:text-sara-primary transition-colors">
            <Image src="/Images/icon-contratos.png" alt="Contratos Icon" width={24} height={24} />
            <span className="text-xs mt-1">Contratos</span>
          </a>
          <a href="#como-funciona" className="flex flex-col items-center text-sara-text hover:text-sara-primary transition-colors">
            <Image src="/Images/icon.propiedades.png" alt="Propiedades Icon" width={24} height={24} />
            <span className="text-xs mt-1">Propiedades</span>
          </a>
          <a href="#como-funciona" className="flex flex-col items-center text-sara-text hover:text-sara-primary transition-colors">
            <Image src="/Images/icon.calendario.png" alt="Calendario Icon" width={24} height={24} />
            <span className="text-xs mt-1">Calendario</span>
          </a>
          <a href="#como-funciona" className="flex flex-col items-center text-sara-text hover:text-sara-primary transition-colors">
            <Image src="/Images/icon.informe.png" alt="Informe Icon" width={24} height={24} />
            <span className="text-xs mt-1">Informe</span>
          </a>
        </nav>
        {/* Botón de imagen CTA en el Header */}
        <div className="hidden md:block">
          <ImageButton src="/Images/CTA.png" alt="Prueba gratis" width={150} height={50} />
        </div>
      </motion.header>

      {/* Hero Section */}
      <section id="hero" className="relative flex flex-col md:flex-row items-center justify-center min-h-screen bg-sara-background pt-24 px-4 md:px-8">
        <div className="text-center md:text-left md:w-1/2 p-4 z-10">
          <motion.h1
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="text-4xl md:text-5xl lg:text-6xl font-extrabold leading-tight text-sara-text mb-4"
          >
            La plataforma más completa para administrar tus arriendos.
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="text-lg md:text-xl text-sara-gray-700 mb-8 max-w-lg mx-auto md:mx-0"
          >
            Contratos, fechas, evaluaciones e informes de comportamiento sin complicaciones.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.8 }}
          >
            {/* Botón de imagen CTA grande en el Hero */}
            <ImageButton src="/Images/CTA.png" alt="Prueba gratis" width={200} height={60} />
          </motion.div>
        </div>
        <div className="relative md:w-1/2 p-4 flex justify-center items-center mt-12 md:mt-0">
          <motion.div
            className="w-full max-w-xl"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 1 }}
          >
            <Image
              src="/Images/hero-banner.png"
              alt="S.A.R.A. Dashboard Mockup"
              width={700}
              height={400}
              className="w-full h-auto rounded-lg shadow-2xl animate-mockupAnimation"
              priority
            />
          </motion.div>
        </div>
      </section>

      {/* Frase Destacada Section */}
      <section className="py-16 bg-sara-white">
        <motion.div
          className="max-w-3xl mx-auto text-center"
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.5 }}
          transition={{ duration: 0.7 }}
        >
          <ShieldCheck className="mx-auto h-12 w-12 text-sara-primary mb-4" />
          <h2 className="text-2xl md:text-3xl font-semibold text-sara-text italic">
            "Administrar el arriendo de una propiedad es mucho más que solo asegurar el pago del arriendo"
          </h2>
        </motion.div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-sara-background px-4 md:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <motion.div className="bg-white p-6 rounded-lg shadow-md hover:shadow-xl transition-shadow" initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.5 }} transition={{ duration: 0.5, delay: 0.1 }}>
              <Image src="/Images/icon-contratos.png" alt="Gestión de contratos" width={48} height={48} className="mb-4" />
              <h3 className="text-xl font-bold text-sara-text mb-2">Gestión de contratos</h3>
              <p className="text-sara-gray-700">Crea, edita y almacena tus contratos con todos los datos (propiedad, inquilino, RUT, montos, fechas y reajustes) en un solo lugar.</p>
            </motion.div>
            <motion.div className="bg-white p-6 rounded-lg shadow-md hover:shadow-xl transition-shadow" initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.5 }} transition={{ duration: 0.5, delay: 0.2 }}>
              <Image src="/Images/icon.propiedades.png" alt="Registro de propiedades" width={48} height={48} className="mb-4" />
              <h3 className="text-xl font-bold text-sara-text mb-2">Registro de propiedades</h3>
              <p className="text-sara-gray-700">Añade propiedades individuales o de forma masiva, y sigue su estado (disponible/arrendada) con un inventario organizado.</p>
            </motion.div>
            <motion.div className="bg-white p-6 rounded-lg shadow-md hover:shadow-xl transition-shadow" initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.5 }} transition={{ duration: 0.5, delay: 0.3 }}>
              <Image src="/Images/icon.calendario.png" alt="Calendario de cumplimiento" width={48} height={48} className="mb-4" />
              <h3 className="text-xl font-bold text-sara-text mb-2">Calendario de cumplimiento</h3>
              <p className="text-sara-gray-700">Visualiza en un calendario todas las fechas críticas: inicios, terminaciones y vencimientos de arriendo, gastos comunes y servicios.</p>
            </motion.div>
            <motion.div className="bg-white p-6 rounded-lg shadow-md hover:shadow-xl transition-shadow" initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.5 }} transition={{ duration: 0.5, delay: 0.4 }}>
              <Bell className="w-12 h-12 text-sara-primary mb-4" />
              <h3 className="text-xl font-bold text-sara-text mb-2">Notificaciones automáticas</h3>
              <p className="text-sara-gray-700">Recibe avisos por email o en el panel cuando se acerquen pagos, vencimientos o actualizaciones de tus contratos.</p>
            </motion.div>
            <motion.div className="bg-white p-6 rounded-lg shadow-md hover:shadow-xl transition-shadow" initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.5 }} transition={{ duration: 0.5, delay: 0.5 }}>
              <Image src="/Images/icon.informe.png" alt="Informe de Comportamiento SARA" width={48} height={48} className="mb-4" />
              <h3 className="text-xl font-bold text-sara-text mb-2">Informe de Comportamiento SARA</h3>
              <p className="text-sara-gray-700">El inquilino puede acceder a un informe oficial que destaca su historial de pagos, cuidado de la propiedad y comunicación, útil para respaldar futuros arriendos.</p>
            </motion.div>
            <motion.div className="bg-white p-6 rounded-lg shadow-md hover:shadow-xl transition-shadow" initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.5 }} transition={{ duration: 0.5, delay: 0.6 }}>
              <AlertTriangle className="w-12 h-12 text-sara-primary mb-4" />
              <h3 className="text-xl font-bold text-sara-text mb-2">Gestión de incidentes</h3>
              <p className="text-sara-gray-700">Reporta, adjunta evidencia y cierra incidentes (reparaciones, ruidos, incumplimientos) manteniendo todo documentado.</p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Cómo funciona Section */}
      <section id="como-funciona" className="py-20 bg-sara-white px-4 md:px-8">
        <motion.h2
          className="text-3xl md:text-4xl font-bold text-center text-sara-text mb-12"
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.5 }}
          transition={{ duration: 0.6 }}
        >
          ¿Cómo funciona S.A.R.A.?
        </motion.h2>

        <div className="max-w-4xl mx-auto space-y-16">
          {/* Step 1 */}
          <motion.div className="flex flex-col md:flex-row items-center md:space-x-8 bg-sara-background rounded-lg shadow-lg p-6" initial={{ opacity: 0, y: 50 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.5 }} transition={{ duration: 0.7 }}>
            <div className="md:w-1/2 text-center md:text-left mb-6 md:mb-0">
              <span className="text-sara-primary text-sm font-semibold mb-2 block">PASO 1</span>
              <h3 className="text-2xl font-bold text-sara-text mb-4">Regístrate y elige tu rol</h3>
              <p className="text-sara-gray-700">Crea tu cuenta de forma rápida y sencilla, seleccionando si eres arrendador o inquilino.</p>
            </div>
            <div className="md:w-1/2 relative p-4 bg-sara-white rounded-md shadow-inner">
              <motion.div initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true, amount: 0.8 }} transition={{ duration: 0.5, delay: 0.2 }} className="flex items-center mb-4">
                <User size={20} className="text-sara-primary mr-2" />
                <input type="text" placeholder="Nombre completo" className="flex-grow p-2 border rounded-md" />
              </motion.div>
              <motion.div initial={{ opacity: 0, x: 20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true, amount: 0.8 }} transition={{ duration: 0.5, delay: 0.4 }} className="flex items-center mb-4">
                <Mail size={20} className="text-sara-primary mr-2" />
                <input type="email" placeholder="Correo electrónico" className="flex-grow p-2 border rounded-md" />
              </motion.div>
              <motion.div initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true, amount: 0.8 }} transition={{ duration: 0.5, delay: 0.6 }} className="flex items-center mb-4">
                <Lock size={20} className="text-sara-primary mr-2" />
                <input type="password" placeholder="Contraseña" className="flex-grow p-2 border rounded-md" />
              </motion.div>
              <motion.div initial={{ opacity: 0, x: 20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true, amount: 0.8 }} transition={{ duration: 0.5, delay: 0.8 }} className="flex items-center">
                <User size={20} className="text-sara-primary mr-2" />
                <select className="flex-grow p-2 border rounded-md">
                  <option>Selecciona tu rol</option>
                  <option>Arrendador</option>
                  <option>Inquilino</option>
                </select>
              </motion.div>
            </div>
          </motion.div>

          {/* Step 2 */}
          <motion.div className="flex flex-col md:flex-row items-center md:space-x-8 bg-sara-background rounded-lg shadow-lg p-6" initial={{ opacity: 0, y: 50 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.5 }} transition={{ duration: 0.7 }}>
            <div className="md:w-1/2 relative p-4 bg-sara-white rounded-md shadow-inner">
              <motion.div initial={{ opacity: 0, scale: 0.9 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true, amount: 0.8 }} transition={{ duration: 0.6, delay: 0.2 }} className="mb-4">
                <label className="block text-sara-text text-sm font-bold mb-2">Dirección de la Propiedad:</label>
                <input type="text" placeholder="Ej. Calle Falsa 123" className="w-full p-2 border rounded-md" />
              </motion.div>
              <motion.div initial={{ opacity: 0, scale: 0.9 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true, amount: 0.8 }} transition={{ duration: 0.6, delay: 0.4 }} className="mb-4">
                <label className="block text-sara-text text-sm font-bold mb-2">Valor de Arriendo:</label>
                <input type="number" placeholder="Ej. 350000" className="w-full p-2 border rounded-md" />
              </motion.div>
              <motion.div initial={{ opacity: 0, scale: 0.9 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true, amount: 0.8 }} transition={{ duration: 0.6, delay: 0.6 }} className="flex items-center justify-center bg-sara-primary text-sara-white py-2 rounded-md">
                <PlusCircle size={20} className="mr-2" />
                <span>Cargar Propiedad</span>
              </motion.div>
            </div>
            <div className="md:w-1/2 text-center md:text-left mt-6 md:mt-0">
              <span className="text-sara-primary text-sm font-semibold mb-2 block">PASO 2</span>
              <h3 className="text-2xl font-bold text-sara-text mb-4">Añade tu primera propiedad y contrato</h3>
              <p className="text-sara-gray-700">Registra los detalles de tu propiedad y crea el primer borrador de contrato.</p>
            </div>
          </motion.div>

          {/* Step 3 */}
          <motion.div className="flex flex-col md:flex-row items-center md:space-x-8 bg-sara-background rounded-lg shadow-lg p-6" initial={{ opacity: 0, y: 50 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.5 }} transition={{ duration: 0.7 }}>
            <div className="md:w-1/2 text-center md:text-left mb-6 md:mb-0">
              <span className="text-sara-primary text-sm font-semibold mb-2 block">PASO 3</span>
              <h3 className="text-2xl font-bold text-sara-text mb-4">Guarda el contrato para activarlo y notificar al inquilino</h3>
              <p className="text-sara-gray-700">El sistema enviará automáticamente la notificación y el contrato a tu inquilino para su revisión.</p>
            </div>
            <div className="md:w-1/2 flex flex-col items-center justify-center h-48 relative">
              <motion.div className="w-24 h-24 bg-sara-primary rounded-full flex items-center justify-center animate-rotateIcon" initial={{ opacity: 0, scale: 0.5 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true, amount: 0.8 }} transition={{ duration: 0.5, delay: 0.2 }}>
                <Save size={48} className="text-sara-white" />
              </motion.div>
              <motion.div className="absolute -top-4 right-1/2 translate-x-1/2 bg-green-500 text-sara-white px-4 py-2 rounded-full shadow-lg flex items-center animate-notificationPop" initial={{ opacity: 0, scale: 0.8 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true, amount: 0.8 }} transition={{ duration: 0.6, delay: 0.8 }}>
                <CheckCircle size={20} className="mr-2" />
                <span>Contrato enviado!</span>
              </motion.div>
              <motion.div className="absolute top-1/2 left-1/2 -translate-x-1/2 translate-y-1/2 bg-blue-500 text-sara-white px-3 py-1 text-sm rounded-md shadow-md flex items-center animate-notificationPop" initial={{ opacity: 0, scale: 0.8 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true, amount: 0.8 }} transition={{ duration: 0.6, delay: 1.2 }}>
                <Bell size={16} className="mr-1" />
                <span>Nueva notificación</span>
              </motion.div>
            </div>
          </motion.div>

          {/* Step 4 */}
          <motion.div className="flex flex-col md:flex-row items-center md:space-x-8 bg-sara-background rounded-lg shadow-lg p-6" initial={{ opacity: 0, y: 50 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.5 }} transition={{ duration: 0.7 }}>
            <div className="md:w-1/2 relative p-4 flex justify-center items-center h-64">
              <motion.div initial={{ opacity: 0, scale: 0.9 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true, amount: 0.8 }} transition={{ duration: 0.6, delay: 0.2 }} className="relative w-full h-full">
                <Image
                  src="/Images/hero-banner.png"
                  alt="Dashboard S.A.R.A."
                  fill
                  style={{ objectFit: 'contain' }}
                  className="rounded-md shadow-inner"
                />
              </motion.div>
            </div>
            <div className="md:w-1/2 text-center md:text-left mt-6 md:mt-0">
              <span className="text-sara-primary text-sm font-semibold mb-2 block">PASO 4</span>
              <h3 className="text-2xl font-bold text-sara-text mb-4">Revisa tu panel</h3>
              <p className="text-sara-gray-700">Accede a un resumen completo de tus propiedades, contratos, pagos y notificaciones en un solo lugar.</p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Ley Devuélveme mi casa Section */}
      <section className="py-20 bg-sara-background px-4 md:px-8">
        <motion.h2 className="text-3xl md:text-4xl font-bold text-center text-sara-text mb-12" initial={{ opacity: 0, y: 50 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.5 }} transition={{ duration: 0.6 }}>
          “Toda la documentación para la Ley Devuélveme mi casa.”
        </motion.h2>
        <div className="max-w-3xl mx-auto flex flex-col md:flex-row items-center justify-center space-y-8 md:space-y-0 md:space-x-12">
          <motion.div className="relative w-full md:w-1/2 h-64" initial={{ opacity: 0, scale: 0.8 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true, amount: 0.5 }} transition={{ duration: 0.8, delay: 0.2 }}>
            <Image
              src="/Images/ley-devuelveme-mi-casa.png"
              alt="Documentación Ley Devuélveme mi Casa"
              fill
              style={{ objectFit: 'contain' }}
              className="rounded-lg shadow-xl"
            />
            <motion.div className="absolute z-10 w-8 h-8 opacity-0" style={{ top: '60%', left: '70%', cursor: 'pointer' }} whileInView={{ opacity: 1, transition: { delay: 1.5, duration: 0.5 } }} animate={{ y: [0, -5, 0], x: [0, 5, 0], scale: [1, 0.9, 1] }} transition={{ repeat: Infinity, duration: 2, repeatDelay: 1 }} viewport={{ once: true, amount: 0.8 }}>
              {/* This is a simplified click simulation. A custom cursor image would be better. */}
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="white"><path d="M7.5 1.5L4.5 9.5H11.5L8.5 1.5H7.5Z" transform="rotate(20 8 8)"/><path d="M12.5 8.5L10.5 18.5L16.5 15.5L19.5 12.5L12.5 8.5Z"/></svg>
            </motion.div>
          </motion.div>
          <motion.p className="md:w-1/2 text-lg text-sara-gray-700 text-center md:text-left" initial={{ opacity: 0, y: 50 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.5 }} transition={{ duration: 0.6, delay: 0.4 }}>
            Con S.A.R.A., accede de forma rápida y sencilla a todos los documentos y guías necesarios para aplicar la Ley N° 21.461, garantizando la protección legal de tus arriendos.
          </motion.p>
        </div>
      </section>

      {/* Footer */}
      <motion.footer
        className="bg-sara-text py-12 px-8 text-sara-white text-center"
        initial={{ opacity: 0, y: 50 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.5 }}
        transition={{ duration: 0.7 }}
      >
        <div className="flex flex-col items-center justify-center space-y-6">
          <Image src="/Images/logo.png" alt="S.A.R.A. Logo" width={80} height={32} className="opacity-70" />
          <div className="flex space-x-6">
            <a href="#" className="text-sara-white hover:text-sara-accent transition-colors">
              <Facebook size={24} />
            </a>
            <a href="#" className="text-sara-white hover:text-sara-accent transition-colors">
              <Twitter size={24} />
            </a>
            <a href="#" className="text-sara-white hover:text-sara-accent transition-colors">
              <Linkedin size={24} />
            </a>
          </div>
          {/* Botón de imagen CTA en el Footer */}
          <ImageButton src="/Images/CTA.png" alt="Prueba gratis" width={180} height={55} />
          <p className="text-sm text-sara-gray-400 mt-4">&copy; {new Date().getFullYear()} S.A.R.A. Todos los derechos reservados.</p>
        </div>
      </motion.footer>
    </div>
  );
};

export default LandingPage;
