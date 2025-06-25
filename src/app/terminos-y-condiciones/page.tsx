export default function TerminosYCondicionesPage() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <h1 className="text-3xl font-bold mb-4 text-center">TÉRMINOS Y CONDICIONES DE USO DE LA PLATAFORMA SARA</h1>
      <p className="text-sm text-center text-muted-foreground mb-6">Última actualización: 24 de junio de 2025</p>

      <div className="space-y-6">
        <section>
          <h2 className="text-2xl font-bold mb-2">IDENTIFICACIÓN DEL RESPONSABLE</h2>
          <p>Razón Social: PCG Innovación y Tecnología SpA</p>
          <p>RUT: 78.052.397-2</p>
          <p>Correo de contacto: contacto@sarachile.cl</p>
        </section>

        <section>
          <h2 className="text-2xl font-bold mb-2">ACEPTACIÓN DE LOS TÉRMINOS</h2>
          <p>
            El usuario, al registrarse y utilizar la plataforma SARA, declara haber leído, comprendido y aceptado íntegramente los presentes Términos y Condiciones, incluyendo la Política de Privacidad.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold mb-2">OBJETO DE LA PLATAFORMA</h2>
          <p>
            SARA es una plataforma digital que permite gestionar contratos de arriendo, evaluar el comportamiento de los arrendatarios, registrar pagos, incidentes y generar documentación de respaldo para ambas partes.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold mb-2">PROTECCIÓN DE DATOS PERSONALES</h2>
          <p>
            El tratamiento de datos personales se rige por la Ley Nº 19.628 sobre Protección de la Vida Privada. SARA recopila y trata datos de forma proporcional, con fines legítimos y con consentimiento informado del usuario. Los datos se utilizarán únicamente para:
          </p>
          <ul className="list-disc list-inside pl-4 my-2 space-y-1">
            <li>Administración de contratos de arriendo.</li>
            <li>Evaluaciones de cumplimiento de obligaciones.</li>
            <li>Servicios internos de soporte y análisis estadístico.</li>
          </ul>
          <p>
            El usuario puede solicitar en cualquier momento la revisión, rectificación o eliminación de sus datos personales, así como revocar el consentimiento otorgado.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold mb-2">GENERACIÓN DE INFORMES DE COMPORTAMIENTO</h2>
          <p>
            SARA permite que el arrendador genere informes sobre el comportamiento de pago y cumplimiento contractual del inquilino. Dichos informes pueden incluir:
          </p>
          <ul className="list-disc list-inside pl-4 my-2 space-y-1">
            <li>Historial de pagos registrados en la plataforma.</li>
            <li>Evaluaciones realizadas por los arrendadores previos.</li>
            <li>Información sobre incidentes o controversias registradas durante el contrato.</li>
          </ul>
          <h3 className="text-xl font-semibold mt-4 mb-2">Restricciones:</h3>
          <ul className="list-disc list-inside pl-4 my-2 space-y-1">
            <li>Estos informes no se venden ni se publican a terceros.</li>
            <li>Su uso está limitado a la evaluación dentro de la plataforma por parte de nuevos arrendadores registrados.</li>
            <li>El inquilino podrá revisar el contenido del informe y tiene derecho a apelar o solicitar correcciones.</li>
            <li>No se realiza monitoreo financiero externo ni se accede a bases de datos de comportamiento crediticio.</li>
            <li>Toda difusión externa del informe requiere consentimiento expreso del inquilino.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-bold mb-2">RESPONSABILIDAD DEL USUARIO</h2>
          <p>
            El usuario es responsable de la veracidad de la información proporcionada y del buen uso de la plataforma. PCG Innovación y Tecnología SpA no será responsable por daños derivados de datos falsos o uso indebido de la información entregada.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold mb-2">MODIFICACIONES A LOS TÉRMINOS Y CONDICIONES</h2>
          <p>
            Nos reservamos el derecho a modificar los presentes términos. Los cambios serán informados por correo electrónico registrado y publicados en el sitio. El uso continuado de la plataforma se entenderá como aceptación de las nuevas condiciones.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold mb-2">LEGISLACIÓN Y JURISDICCIÓN</h2>
          <p>
            Estos Términos y Condiciones se rigen por la legislación chilena. Cualquier controversia será resuelta por los tribunales ordinarios de justicia de Santiago de Chile.
          </p>
        </section>
      </div>
    </div>
  );
}
