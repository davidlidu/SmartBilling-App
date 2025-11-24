import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export const generatePdfFromElement = async (elementId: string, fileName: string = 'invoice.pdf', quality: 'high' | 'low' = 'high'): Promise<void> => {
  console.log(`Attempting to generate PDF for element: #${elementId} with ${quality} quality.`);
  const input = document.getElementById(elementId);
  if (!input) {
    console.error(`Element with id ${elementId} not found.`);
    alert(`Error: No se pudo encontrar el elemento para generar el PDF.`);
    return;
  }

  const scale = quality === 'high' ? 2 : 1.2; // Control quality via scale

  const html2canvasOptions = {
    scale, // Use the determined scale
    useCORS: true,
    logging: true,
  };
  console.log('html2canvas options:', html2canvasOptions);

  try {
    const canvas = await html2canvas(input, html2canvasOptions);
    console.log(`Canvas created with dimensions: ${canvas.width}x${canvas.height}`);

    if (!canvas.width || !canvas.height) {
      console.error('html2canvas returned a canvas with zero width or height.');
      alert('Error: No se pudo generar el PDF porque el contenido visual no tiene dimensiones. Asegúrese de que el contenido de la factura sea visible.');
      return;
    }

    const imgData = canvas.toDataURL('image/png');
    console.log(`imgData length: ${imgData.length}, starts with: ${imgData.substring(0, 50)}`);
    if (imgData === 'data:,') {
        console.error('html2canvas produced empty image data.');
        alert('Error: No se pudo generar el PDF porque la captura de la imagen falló.');
        return;
    }
    
    // Determine PDF orientation and size based on content
    // A4 dimensions: 210mm x 297mm
    const pdfWidth = 210; // A4 width in mm
    const pageHeightA4 = 297; // A4 height in mm

    const totalImageHeightInMM = (canvas.height * pdfWidth) / canvas.width; // Maintain aspect ratio, total height in mm
    console.log(`Calculated PDF page width: ${pdfWidth}mm, total scaled image height: ${totalImageHeightInMM}mm`);

    const pdf = new jsPDF({
      orientation: pdfWidth > totalImageHeightInMM ? 'landscape' : 'portrait',
      unit: 'mm',
      format: [pdfWidth, pageHeightA4] 
    });
    
    const imgHeightScaledToPdf = totalImageHeightInMM;

    let position = 0;

    if (imgHeightScaledToPdf <= pageHeightA4) {
        console.log('Content fits on a single page.');
        pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, imgHeightScaledToPdf);
    } else {
        console.log('Content requires multiple pages.');
        pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, imgHeightScaledToPdf);
        let heightLeftOnImage = imgHeightScaledToPdf - pageHeightA4;
        position -= pageHeightA4;

        console.log(`Page 1 added. Image Y position: 0. Height left on image: ${heightLeftOnImage}mm`);

        while (heightLeftOnImage > 0) {
            pdf.addPage();
            console.log(`Adding page ${pdf.getNumberOfPages()}, current image Y position for addImage: ${position}mm`);
            pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, imgHeightScaledToPdf);
            heightLeftOnImage -= pageHeightA4;
            position -= pageHeightA4;
            console.log(`Image Y position for next iteration: ${position}. Height left on image: ${heightLeftOnImage}mm`);
        }
    }
    
    console.log('Attempting to save PDF as:', fileName);
    pdf.save(fileName);
    console.log('PDF save command issued.');

  } catch (error) {
    console.error('Error generating PDF:', error);
    alert('Error al generar el PDF. Consulte la consola para más detalles.');
  }
};
