function filterWelcomeMessages(templates) {
    const validWelcomeMessages = [];
    const invalidWelcomeMessages = [];
  
    templates.forEach((template) => {
      // Check minimum length
      if (template.length < 5) {
        invalidWelcomeMessages.push(template);
      } else {
        // Check for valid parameters (optional)
        const isValid = /^(?: (\$username|\$first_name|\$last_name|[a-zA-Z]+))*$/.test(template);
        if (isValid) {
          validWelcomeMessages.push(template);
        } else {
          invalidWelcomeMessages.push(template);
        }
      }
    });
  
    return {
      valid: validWelcomeMessages,
      invalid: invalidWelcomeMessages,
    };
  }
  
  // Example usage:
  const welcomeTemplates = [
    "Hello user $username",
    "Welcome to the community $first_name",
    "Hi $last_name",
    "Hello dude",
    "Hello $user",
    "Welcome to the community {username}",
  ];
  
  const result = filterWelcomeMessages(welcomeTemplates);
  console.log("Valid Welcome Messages:", result.valid);
  console.log("Invalid Welcome Messages:", result.invalid);
  