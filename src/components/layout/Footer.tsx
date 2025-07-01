
import { Instagram, Facebook } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="bg-gray-800 text-white p-4">
      <div className="container mx-auto flex justify-between items-center">
        <p>© 2024 SARA Chile. Todos los derechos reservados.</p>
        <div className="flex space-x-4">
          <a href="https://www.instagram.com/sarachile2025" target="_blank" rel="noopener noreferrer">
            <Instagram className="h-6 w-6" />
          </a>
          <a href="https://www.facebook.com/SARA-Chile" target="_blank" rel="noopener noreferrer">
            <Facebook className="h-6 w-6" />
          </a>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
