const isValidInput = (input) => {
    // Perform validation checks
    return /^[a-zA-Z0-9]+$/.test(input); // Example: Allow only alphanumeric characters
};

const escapeHTML = (text) => {
    return text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
};

