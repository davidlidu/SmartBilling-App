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

  // Quality control: High (Print) = scale 2 or 3, Low (Web/Email) = scale 1 or 1.2
  // Reducing scale significantly reduces file size.
  const scale = quality === 'high' ? 2 : 1; 

  const html2canvasOptions = {
    scale, 
    useCORS: true,
    logging: false, // Turn off logging for production feel
    backgroundColor: '#ffffff', // Ensure white background
  };

  try {
    const canvas = await html2canvas(input, html2canvasOptions);

    if (!canvas.width || !canvas.height) {
      alert('Error: No se pudo generar el PDF porque el contenido visual no tiene dimensiones.');
      return;
    }

    const imgData = canvas.toDataURL(quality === 'high' ? 'image/png' : 'image/jpeg', quality === 'high' ? 1.0 : 0.7);
    
    // A4 dimensions: 210mm x 297mm
    const pdfWidth = 210; 
    const pageHeightA4 = 297; 

    const totalImageHeightInMM = (canvas.height * pdfWidth) / canvas.width; 

    const pdf = new jsPDF({
      orientation: pdfWidth > totalImageHeightInMM ? 'landscape' : 'portrait',
      unit: 'mm',
      format: [pdfWidth, pageHeightA4],
      compress: true // Enable internal PDF compression
    });
    
    const imgHeightScaledToPdf = totalImageHeightInMM;
    let position = 0;

    // Single page check
    if (imgHeightScaledToPdf <= pageHeightA4) {
        pdf.addImage(imgData, quality === 'high' ? 'PNG' : 'JPEG', 0, 0, pdfWidth, imgHeightScaledToPdf);
    } else {
        // Multi-page logic
        pdf.addImage(imgData, quality === 'high' ? 'PNG' : 'JPEG', 0, position, pdfWidth, imgHeightScaledToPdf);
        let heightLeftOnImage = imgHeightScaledToPdf - pageHeightA4;
        position -= pageHeightA4;

        while (heightLeftOnImage > 0) {
            pdf.addPage();
            pdf.addImage(imgData, quality === 'high' ? 'PNG' : 'JPEG', 0, position, pdfWidth, imgHeightScaledToPdf);
            heightLeftOnImage -= pageHeightA4;
            position -= pageHeightA4;
        }
    }
    
    pdf.save(fileName);

  } catch (error) {
    console.error('Error generating PDF:', error);
    alert('Error al generar el PDF. Consulte la consola para más detalles.');
  }
};