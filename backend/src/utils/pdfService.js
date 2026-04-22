const PDFDocument = require('pdfkit');

exports.generateBookingPDF = (booking, tourist, serviceDetails) => {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50 });
    const buffers = [];
    doc.on('data', b => buffers.push(b));
    doc.on('end', () => resolve(Buffer.concat(buffers)));
    doc.on('error', reject);

    // Header
    doc.fontSize(22).fillColor('#2563eb').text('Tourism Southern Sri Lanka', { align: 'center' });
    doc.moveDown(0.5);
    doc.fontSize(16).fillColor('#000').text('Booking Receipt', { align: 'center' });
    doc.moveDown();
    doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke('#2563eb');
    doc.moveDown();

    // Booking details
    doc.fontSize(12).fillColor('#374151');
    doc.text(`Reference Number: ${booking.referenceNumber}`, { bold: true });
    doc.text(`Tourist: ${tourist.name}`);
    doc.text(`Email: ${tourist.email}`);
    doc.text(`Service Type: ${booking.serviceType.toUpperCase()}`);
    doc.text(`Start Date: ${new Date(booking.startDate).toDateString()}`);
    doc.text(`End Date: ${new Date(booking.endDate).toDateString()}`);
    doc.text(`Status: ${booking.status}`);
    doc.text(`Payment Status: ${booking.paymentStatus}`);
    doc.text(`Total Price: LKR ${booking.totalPrice}`);
    if (booking.specialRequests) doc.text(`Special Requests: ${booking.specialRequests}`);
    doc.moveDown();

    if (serviceDetails) {
      doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke('#e5e7eb');
      doc.moveDown(0.5);
      doc.fontSize(13).fillColor('#2563eb').text('Service Details');
      doc.fontSize(12).fillColor('#374151');
      Object.entries(serviceDetails).forEach(([k, v]) => {
        doc.text(`${k}: ${v}`);
      });
    }

    doc.moveDown(2);
    doc.fontSize(10).fillColor('#9ca3af').text('Thank you for choosing Tourism Southern Sri Lanka!', { align: 'center' });
    doc.end();
  });
};

exports.generateProfilePDF = (user) => {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50 });
    const buffers = [];
    doc.on('data', b => buffers.push(b));
    doc.on('end', () => resolve(Buffer.concat(buffers)));
    doc.on('error', reject);

    doc.fontSize(22).fillColor('#2563eb').text('My Profile Data', { align: 'center' });
    doc.moveDown();
    doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke('#2563eb');
    doc.moveDown();
    doc.fontSize(12).fillColor('#374151');
    doc.text(`Name: ${user.name}`);
    doc.text(`Email: ${user.email}`);
    doc.text(`Phone: ${user.phone || 'N/A'}`);
    doc.text(`Role: ${user.role}`);
    doc.text(`Nationality: ${user.nationality || 'N/A'}`);
    doc.text(`Member Since: ${new Date(user.createdAt).toDateString()}`);
    doc.text(`Account Status: ${user.status}`);
    doc.moveDown(2);
    doc.fontSize(10).fillColor('#9ca3af').text('Downloaded from Tourism Southern Sri Lanka', { align: 'center' });
    doc.end();
  });
};
