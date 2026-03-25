// /middleware/validation.js
module.exports = {
    validateDeliveryForm: (req, res, next) => {
        const { customerName, address, phone, packageDetails } = req.body;

        const errors = [];

        // Check for empty fields
        if (!customerName || !address || !phone || !packageDetails) {
            errors.push('All fields are required.');
        }

        // Validate name
        if (customerName && !/^[A-Za-z\s]+$/.test(customerName)) {
            errors.push('Customer name should only contain letters and spaces.');
        }

        // Validate phone number (Kenyan format or 10–15 digits)
        if (phone && !/^(\+254|0)?[0-9]{9,15}$/.test(phone)) {
            errors.push('Please enter a valid phone number.');
        }

        // Validate address
        if (address && address.length < 5) {
            errors.push('Address must be at least 5 characters long.');
        }

        // Validate package details
        if (packageDetails && packageDetails.length < 3) {
            errors.push('Package details must be at least 3 characters.');
        }

        // If there are any errors, re-render the form
        if (errors.length > 0) {
            return res.render('addDelivery', {
                error: errors.join(' '),
                formData: req.body,
            });
        }

        // All good — continue
        next();
    },

    validateRiderForm: (req, res, next) => {
        const { name, id, contact } = req.body;
        const errors = [];

        if (!name || !id || !contact) {
            errors.push('All fields are required.');
        }

        if (name && !/^[A-Za-z\s]+$/.test(name)) {
            errors.push('Rider name should only contain letters and spaces.');
        }

        if (id && !/^[A-Za-z0-9]+$/.test(id)) {
            errors.push('Rider ID must be alphanumeric.');
        }

        if (contact && !/^(\+254|0)?[0-9]{9,15}$/.test(contact)) {
            errors.push('Please enter a valid phone number.');
        }

        if (errors.length > 0) {
            return res.render('addRider', {
                error: errors.join(' '),
                formData: req.body,
            });
        }

        next();
    }
};
