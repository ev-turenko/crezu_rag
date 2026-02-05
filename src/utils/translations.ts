const unsafeChatMessageTranslations = {
    'es': "Su mensaje no cumple con la política de seguridad de la conversación.",
    'es-mx': "Su mensaje no cumple con la política de seguridad de la conversación.",
    'es-es': "Tu mensaje no cumple con la política de seguridad de la conversación.",
    'pl': "Twoja wiadomość nie spełnia polityki bezpieczeństwa rozmowy.",
    'en': "Your message does not meet the conversation security policy.",
    'ro': "Mesajul dumneavoastră nu îndeplinește politica de securitate a conversației.",
    'se': "Ditt meddelande uppfyller inte konversationssäkerhetspolicyn."
}

const onlyFinanceMessageTranslations = {
    'es': "Por favor, limite sus preguntas a temas financieros.",
    'es-mx': "Por favor, limite sus preguntas a temas financieros.",
    'es-es': "Por favor, limita tus preguntas a temas financieros.",
    'pl': "Proszę ograniczyć swoje pytania do tematów finansowych.",
    'en': "Please limit your questions to financial topics.",
    'ro': "Vă rugăm să vă limitați întrebările la subiecte financiare.",
    'se': "Vänligen begränsa dina frågor till finansiella ämnen."
}

const serverErrorMessageTranslations = {
    'es': "Error del servidor. Por favor, inténtelo de nuevo más tarde.",
    'es-mx': "Error del servidor. Por favor, inténtelo de nuevo más tarde.",
    'es-es': "Error del servidor. Por favor, inténtalo de nuevo más tarde.",
    'pl': "Błąd serwera. Proszę spróbować ponownie później.",
    'en': "Server error. Please try again later.",
    'ro': "Eroare de server. Vă rugăm să încercați din nou mai târziu.",
    'se': "Serverfel. Vänligen försök igen senare."
}

const failedToGenerateResponseTranslations = {
    'es': "No se pudo generar una respuesta. Por favor, inténtelo de nuevo.",
    'es-mx': "No se pudo generar una respuesta. Por favor, inténtelo de nuevo.",
    'es-es': "No se pudo generar una respuesta. Por favor, inténtalo de nuevo.",
    'pl': "Nie można wygenerować odpowiedzi. Proszę spróbować ponownie.",
    'en': "Failed to generate a response. Please try again.",
    'ro': "Nu s-a putut genera un răspuns. Vă rugăm să încercați din nou.",
    'se': "Det gick inte att generera ett svar. Vänligen försök igen."
}

export const translations = {
    unsafeChatMessage: unsafeChatMessageTranslations,
    onlyFinanceMessage: onlyFinanceMessageTranslations,
    serverErrorMessage: serverErrorMessageTranslations,
    generationErrorMessage: failedToGenerateResponseTranslations
}