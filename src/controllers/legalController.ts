import { Request, Response } from 'express';

interface CountryPolicyData {
    lang: string;
    idDocument: string;
    dpaName: string;
    dpaPhone: string;
    unsubUrl: string;
    template: 'en' | 'es' | 'de' | 'ru' | 'ms' | 'ro' | 'uk' | 'vi';
}

const COMPANY_ADDRESS = 'Harju maakond, Tallinn, Kesklinna linnaosa, Tartu mnt 52/1-166, 10115, Estonia';
const COMPANY_EMAIL = 'compliance@finmatcher.com';

const countryPolicies: Record<string, CountryPolicyData> = {
    co: {
        lang: 'es', idDocument: 'cédula de ciudadanía',
        dpaName: 'Superintendencia de Industria y Comercio (SIC)', dpaPhone: '601 587 0000',
        unsubUrl: 'https://unsub.finmatcher.com/CO/gdpr/', template: 'es',
    },
    de: {
        lang: 'de', idDocument: 'Personalausweis oder Reisepass',
        dpaName: 'Bundesbeauftragter für den Datenschutz und die Informationsfreiheit (BfDI)', dpaPhone: '+49 228 997799-0',
        unsubUrl: 'https://unsub.finmatcher.com/DE/gdpr/', template: 'de',
    },
    kz: {
        lang: 'ru', idDocument: 'удостоверение личности',
        dpaName: 'Министерство цифрового развития, инноваций и аэрокосмической промышленности РК', dpaPhone: '+7 (7172) 74-13-14',
        unsubUrl: 'https://unsub.finmatcher.com/KZ/gdpr/', template: 'ru',
    },
    lk: {
        lang: 'en', idDocument: 'National Identity Card (NIC)',
        dpaName: 'Data Protection Authority of Sri Lanka', dpaPhone: '+94 11 233 3333',
        unsubUrl: 'https://unsub.finmatcher.com/LK/gdpr/', template: 'en',
    },
    my: {
        lang: 'ms', idDocument: 'Kad Pengenalan (MyKad)',
        dpaName: 'Jabatan Perlindungan Data Peribadi (JPDP)', dpaPhone: '+60 3-8911 5000',
        unsubUrl: 'https://unsub.finmatcher.com/MY/gdpr/', template: 'ms',
    },
    pe: {
        lang: 'es', idDocument: 'Documento Nacional de Identidad (DNI)',
        dpaName: 'Autoridad Nacional de Protección de Datos Personales – INDECOPI', dpaPhone: '0800-4-4040',
        unsubUrl: 'https://unsub.finmatcher.com/PE/gdpr/', template: 'es',
    },
    ph: {
        lang: 'en', idDocument: 'Philippine Identification Card (PhilSys ID)',
        dpaName: 'National Privacy Commission (NPC)', dpaPhone: '+63 2 8234 2228',
        unsubUrl: 'https://unsub.finmatcher.com/PH/gdpr/', template: 'en',
    },
    ro: {
        lang: 'ro', idDocument: 'carte de identitate (CI)',
        dpaName: 'Autoritatea Națională de Supraveghere a Prelucrării Datelor cu Caracter Personal (ANSPDCP)', dpaPhone: '+40 318 059 211',
        unsubUrl: 'https://unsub.finmatcher.com/RO/gdpr/', template: 'ro',
    },
    ua: {
        lang: 'uk', idDocument: 'паспорт або ID-картка',
        dpaName: 'Уповноважений Верховної Ради України з прав людини', dpaPhone: '+38 044 299 70 70',
        unsubUrl: 'https://unsub.finmatcher.com/UA/gdpr/', template: 'uk',
    },
    vn: {
        lang: 'vi', idDocument: 'Căn cước công dân (CCCD)',
        dpaName: 'Bộ Thông tin và Truyền thông', dpaPhone: '1800 1166',
        unsubUrl: 'https://unsub.finmatcher.com/VN/gdpr/', template: 'vi',
    },
    za: {
        lang: 'en', idDocument: 'South African ID Document',
        dpaName: 'Information Regulator of South Africa', dpaPhone: '+27 10 023 5207',
        unsubUrl: 'https://unsub.finmatcher.com/ZA/gdpr/', template: 'en',
    },
};

function pageWrapper(lang: string, title: string, body: string): string {
    return `<!DOCTYPE html>
<html lang="${lang}">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${title}</title>
<style>
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 800px; margin: 0 auto; padding: 24px 16px 64px; color: #1a1a1a; line-height: 1.6; font-size: 16px; }
  h1 { font-size: 1.6rem; margin-bottom: 4px; }
  .version { color: #666; font-size: 0.9rem; margin-bottom: 2rem; }
  h2 { font-size: 1.15rem; margin-top: 2rem; margin-bottom: 0.5rem; }
  ul, ol { padding-left: 1.5rem; }
  li { margin-bottom: 0.4rem; }
  a { color: #1a73e8; }
  p { margin: 0.6rem 0; }
  address { font-style: normal; }
</style>
</head>
<body>
${body}
</body>
</html>`;
}

function enTemplate(d: CountryPolicyData): string {
    return pageWrapper('en', 'Privacy Policy – Finmatcher', `
<h1>PRIVACY POLICY</h1>
<p class="version">Version 2, August 4, 2025</p>

<h2>1. INTRODUCTION</h2>
<p>ADSKI values your privacy and is committed to the responsible processing of your personal data. This Privacy Policy outlines the basic principles and terms governing how we handle your personal data, as well as the security measures we have implemented.</p>
<p>This policy applies to the Finmatcher website and applications, including marketing communications promoting our services.</p>

<h2>2. DATA CONTROLLER CONTACT INFORMATION</h2>
<p>ADSKI OÜ acts as the data controller unless otherwise stated.</p>
<address>
  <strong>Postal Address:</strong> ${COMPANY_ADDRESS}<br>
  <strong>Email:</strong> <a href="mailto:${COMPANY_EMAIL}">${COMPANY_EMAIL}</a>
</address>

<h2>3. DATA PROCESSING: PURPOSES, LEGAL BASES &amp; RETENTION</h2>
<p>ADSKI acts as data controller, autonomously determining the purposes of processing and selecting appropriate tools.</p>
<p><strong>Processing activities include:</strong></p>
<ul>
  <li>Account registration (email, name, access data via direct submission or third-party authenticators)</li>
  <li>User identification and authorisation</li>
  <li>Saving favourite offers and comparing financial products</li>
  <li>Age verification</li>
  <li>Loan application preparation and submission to credit institutions</li>
  <li>Promotion of preliminary credit offers</li>
  <li>Service progress notifications</li>
  <li>Customer support</li>
  <li>Feedback collection</li>
  <li>Customer experience management</li>
  <li>Marketing (email, push, SMS, messaging apps)</li>
  <li>Security and fraud prevention</li>
  <li>Legal rights protection and dispute resolution</li>
</ul>
<p><strong>Categories of data collected:</strong></p>
<ul>
  <li>Personal identification details (name, date of birth, ID numbers from your ${d.idDocument})</li>
  <li>Contact information (email, phone, address)</li>
  <li>Financial information (income, expenses, bank accounts)</li>
  <li>Employment details</li>
  <li>Family and living situation</li>
  <li>Education history</li>
  <li>Other financial obligations</li>
</ul>
<p><strong>Retention:</strong> Personal data is processed until the stated purposes are fulfilled.</p>

<h2>4. AUTOMATED DECISION-MAKING</h2>
<p>We do not use automated decision-making or automated profiling to evaluate aspects of your personality.</p>

<h2>5. THIRD-PARTY DATA SHARING</h2>
<p>Data transfers require adequate technical and organisational safeguards through contracts with binding data protection obligations.</p>
<p>Cross-border transfers to third countries require adequate protection levels. Where such levels are insufficient, appropriate safeguards and Transfer Impact Assessments (TIA) are implemented.</p>
<p><strong>Categories of third parties:</strong></p>
<ol>
  <li><strong>Email marketing IT provider</strong> (EEA) – Processor</li>
  <li><strong>Web hosting provider</strong> (USA / EU–US Data Privacy Framework participant, Belgium) – Processor</li>
  <li><strong>Cookie analytics IT providers</strong> (USA / EU–US Data Privacy Framework) – Processor</li>
  <li><strong>Database management and security provider</strong> (EEA) – Processor</li>
  <li><strong>Financial partners</strong> (credit institutions, brokers, service intermediaries) (EEA) – Joint Controllers</li>
</ol>

<h2>6. YOUR RIGHTS</h2>
<p><strong>Access:</strong> You have the right to obtain information about the processing of your data, including data categories, recipients, retention periods, and transfer safeguards.</p>
<p><strong>Rectification:</strong> You may request correction of inaccurate or incomplete personal data.</p>
<p><strong>Deletion:</strong> You may request erasure of your personal data without undue delay.</p>
<p><strong>Restriction:</strong> You may request restriction of processing of your data.</p>
<p><strong>Data Portability:</strong> You have the right to receive your data in a structured, machine-readable format.</p>
<p><strong>Objection:</strong> You may object to processing based on legitimate interest or public interest grounds.</p>
<p><strong>Withdrawal of Consent:</strong> You may withdraw consent at any time for consent-based processing.</p>
<p><strong>Complaint:</strong> You may file a complaint with the competent supervisory authority: ${d.dpaName} — ${d.dpaPhone}.</p>
<p><strong>Contact us:</strong> <a href="mailto:${COMPANY_EMAIL}">${COMPANY_EMAIL}</a>. We will respond within one month of receiving your request.</p>
<p><strong>Marketing opt-out:</strong> Use the unsubscribe link in any marketing communication or click <a href="${d.unsubUrl}">here</a>.</p>

<h2>7. CHANGES TO THIS POLICY</h2>
<p>Substantial changes to this Privacy Policy will be communicated via push notifications, SMS, or email before taking effect.</p>
`);
}

function esTemplate(d: CountryPolicyData): string {
    return pageWrapper('es', 'Política de Privacidad – Finmatcher', `
<h1>AVISO DE PRIVACIDAD</h1>
<p class="version">Versión 2, 4 de agosto de 2025</p>

<h2>1. INTRODUCCIÓN</h2>
<p>ADSKI valora su privacidad y se compromete con el tratamiento responsable de sus datos personales. Este Aviso de Privacidad describe los principios y términos básicos que rigen el manejo de sus datos personales, así como las medidas de seguridad que hemos implementado.</p>
<p>Esta política aplica al sitio web y las aplicaciones de Finmatcher, incluidas las comunicaciones de marketing que promueven nuestros servicios.</p>

<h2>2. INFORMACIÓN DE CONTACTO DEL RESPONSABLE</h2>
<p>ADSKI OÜ actúa como responsable del tratamiento de datos, salvo indicación contraria.</p>
<address>
  <strong>Dirección postal:</strong> ${COMPANY_ADDRESS}<br>
  <strong>Correo electrónico:</strong> <a href="mailto:${COMPANY_EMAIL}">${COMPANY_EMAIL}</a>
</address>

<h2>3. TRATAMIENTO DE DATOS: FINALIDADES, BASES LEGALES Y CONSERVACIÓN</h2>
<p>ADSKI actúa como responsable del tratamiento, determinando de forma autónoma las finalidades del tratamiento y seleccionando los medios adecuados.</p>
<p><strong>Las actividades de tratamiento incluyen:</strong></p>
<ul>
  <li>Registro de cuenta (correo electrónico, nombre, datos de acceso mediante envío directo o autenticadores de terceros)</li>
  <li>Identificación y autenticación de usuarios</li>
  <li>Guardado de ofertas favoritas y comparación de productos financieros</li>
  <li>Verificación de edad</li>
  <li>Preparación y envío de solicitudes de crédito a entidades financieras</li>
  <li>Promoción de ofertas crediticias preliminares</li>
  <li>Notificaciones sobre el avance del servicio</li>
  <li>Atención al cliente</li>
  <li>Recopilación de comentarios</li>
  <li>Gestión de la experiencia del cliente</li>
  <li>Marketing (correo electrónico, notificaciones push, SMS, aplicaciones de mensajería)</li>
  <li>Seguridad y prevención del fraude</li>
  <li>Protección de derechos legales y resolución de controversias</li>
</ul>
<p><strong>Categorías de datos recopilados:</strong></p>
<ul>
  <li>Datos de identificación personal (nombre, fecha de nacimiento, números de identificación de su ${d.idDocument})</li>
  <li>Información de contacto (correo electrónico, teléfono, dirección)</li>
  <li>Información financiera (ingresos, gastos, cuentas bancarias)</li>
  <li>Datos laborales</li>
  <li>Situación familiar y de convivencia</li>
  <li>Historial educativo</li>
  <li>Otras obligaciones financieras</li>
</ul>
<p><strong>Conservación:</strong> Los datos personales se procesan hasta que se cumplan las finalidades indicadas.</p>

<h2>4. DECISIONES AUTOMATIZADAS</h2>
<p>No utilizamos decisiones automatizadas ni elaboración de perfiles automatizados para evaluar aspectos de su personalidad.</p>

<h2>5. TRANSFERENCIA DE DATOS A TERCEROS</h2>
<p>Las transferencias de datos requieren salvaguardas técnicas y organizativas adecuadas mediante contratos con obligaciones vinculantes de protección de datos.</p>
<p>Las transferencias internacionales a terceros países requieren niveles de protección adecuados. Cuando dichos niveles sean insuficientes, se implementarán las salvaguardas apropiadas y Evaluaciones de Impacto de Transferencia (TIA).</p>
<p><strong>Categorías de terceros:</strong></p>
<ol>
  <li><strong>Proveedor de email marketing</strong> (EEE) – Encargado del tratamiento</li>
  <li><strong>Proveedor de alojamiento web</strong> (EE. UU. / participante en el Marco de Privacidad de Datos UE-EE. UU., Bélgica) – Encargado del tratamiento</li>
  <li><strong>Proveedores de analítica de cookies</strong> (EE. UU. / Marco de Privacidad de Datos UE-EE. UU.) – Encargados del tratamiento</li>
  <li><strong>Proveedor de gestión de bases de datos y seguridad</strong> (EEE) – Encargado del tratamiento</li>
  <li><strong>Socios financieros</strong> (entidades de crédito, corredores, intermediarios de servicios) (EEE) – Corresponsables del tratamiento</li>
</ol>

<h2>6. SUS DERECHOS</h2>
<p><strong>Acceso:</strong> Tiene derecho a obtener información sobre el tratamiento de sus datos, incluyendo categorías de datos, destinatarios, plazos de conservación y salvaguardas de transferencia.</p>
<p><strong>Rectificación:</strong> Puede solicitar la corrección de datos personales inexactos o incompletos.</p>
<p><strong>Supresión:</strong> Puede solicitar la eliminación de sus datos personales sin demora injustificada.</p>
<p><strong>Limitación:</strong> Puede solicitar la restricción del tratamiento de sus datos.</p>
<p><strong>Portabilidad:</strong> Tiene derecho a recibir sus datos en un formato estructurado y legible por máquina.</p>
<p><strong>Oposición:</strong> Puede oponerse al tratamiento basado en interés legítimo o en interés público.</p>
<p><strong>Retirada del consentimiento:</strong> Puede retirar su consentimiento en cualquier momento para el tratamiento basado en consentimiento.</p>
<p><strong>Reclamación:</strong> Puede presentar una reclamación ante la autoridad supervisora competente: ${d.dpaName} — ${d.dpaPhone}.</p>
<p><strong>Contáctenos:</strong> <a href="mailto:${COMPANY_EMAIL}">${COMPANY_EMAIL}</a>. Responderemos en el plazo de un mes desde la recepción de su solicitud.</p>
<p><strong>Baja de marketing:</strong> Use el enlace de baja incluido en cualquier comunicación comercial o haga clic <a href="${d.unsubUrl}">aquí</a>.</p>

<h2>7. MODIFICACIONES DE ESTE DOCUMENTO</h2>
<p>Los cambios sustanciales en esta Política de Privacidad se comunicarán mediante notificaciones push, SMS o correo electrónico antes de su entrada en vigor.</p>
`);
}

function deTemplate(d: CountryPolicyData): string {
    return pageWrapper('de', 'Datenschutzerklärung – Finmatcher', `
<h1>DATENSCHUTZERKLÄRUNG</h1>
<p class="version">Version 2, 4. August 2025</p>

<h2>1. EINLEITUNG</h2>
<p>ADSKI legt großen Wert auf den Schutz Ihrer Privatsphäre und ist bestrebt, Ihre personenbezogenen Daten verantwortungsbewusst zu verarbeiten. Diese Datenschutzerklärung beschreibt die grundlegenden Prinzipien und Bedingungen für den Umgang mit Ihren personenbezogenen Daten sowie die von uns implementierten Sicherheitsmaßnahmen.</p>
<p>Diese Richtlinie gilt für die Website und Anwendungen von Finmatcher, einschließlich Marketingkommunikation zur Bewerbung unserer Dienste.</p>

<h2>2. KONTAKTDATEN DES VERANTWORTLICHEN</h2>
<p>ADSKI OÜ ist der Verantwortliche für die Datenverarbeitung, sofern nichts anderes angegeben ist.</p>
<address>
  <strong>Postanschrift:</strong> ${COMPANY_ADDRESS}<br>
  <strong>E-Mail:</strong> <a href="mailto:${COMPANY_EMAIL}">${COMPANY_EMAIL}</a>
</address>

<h2>3. DATENVERARBEITUNG: ZWECKE, RECHTSGRUNDLAGEN &amp; SPEICHERDAUER</h2>
<p>ADSKI handelt als Verantwortlicher und bestimmt eigenständig die Zwecke der Verarbeitung sowie die geeigneten Mittel.</p>
<p><strong>Verarbeitungsaktivitäten umfassen:</strong></p>
<ul>
  <li>Kontoregistrierung (E-Mail, Name, Zugangsdaten über direkte Eingabe oder Drittanbieter-Authentifikatoren)</li>
  <li>Nutzeridentifikation und -autorisierung</li>
  <li>Speichern von Lieblingsangeboten und Vergleich von Finanzprodukten</li>
  <li>Altersverifizierung</li>
  <li>Vorbereitung und Übermittlung von Kreditanträgen an Kreditinstitute</li>
  <li>Bewerbung vorläufiger Kreditangebote</li>
  <li>Benachrichtigungen über den Servicestatus</li>
  <li>Kundensupport</li>
  <li>Feedback-Erhebung</li>
  <li>Kundenerfahrungsmanagement</li>
  <li>Marketing (E-Mail, Push, SMS, Messaging-Apps)</li>
  <li>Sicherheit und Betrugsprävention</li>
  <li>Schutz von Rechten und Streitbeilegung</li>
</ul>
<p><strong>Kategorien der erhobenen Daten:</strong></p>
<ul>
  <li>Persönliche Identifikationsdaten (Name, Geburtsdatum, Dokumentennummern aus ${d.idDocument})</li>
  <li>Kontaktdaten (E-Mail, Telefon, Adresse)</li>
  <li>Finanzdaten (Einkommen, Ausgaben, Bankkonten)</li>
  <li>Beschäftigungsangaben</li>
  <li>Familien- und Wohnsituation</li>
  <li>Bildungshistorie</li>
  <li>Sonstige finanzielle Verpflichtungen</li>
</ul>
<p><strong>Speicherdauer:</strong> Personenbezogene Daten werden bis zur Erfüllung der genannten Zwecke verarbeitet.</p>

<h2>4. AUTOMATISIERTE ENTSCHEIDUNGSFINDUNG</h2>
<p>Wir verwenden keine automatisierten Entscheidungen oder automatisiertes Profiling zur Bewertung von Aspekten Ihrer Persönlichkeit.</p>

<h2>5. DATENWEITERGABE AN DRITTE</h2>
<p>Datenübermittlungen erfordern angemessene technische und organisatorische Schutzmaßnahmen durch Verträge mit verbindlichen Datenschutzverpflichtungen.</p>
<p>Grenzüberschreitende Übermittlungen in Drittländer setzen ein angemessenes Schutzniveau voraus. Soweit dies nicht gegeben ist, werden geeignete Garantien und Transfer Impact Assessments (TIA) implementiert.</p>
<p><strong>Kategorien von Dritten:</strong></p>
<ol>
  <li><strong>E-Mail-Marketing-IT-Anbieter</strong> (EWR) – Auftragsverarbeiter</li>
  <li><strong>Webhosting-Anbieter</strong> (USA / EU–US-Datenschutzrahmen, Belgien) – Auftragsverarbeiter</li>
  <li><strong>Cookie-Analyse-Anbieter</strong> (USA / EU–US-Datenschutzrahmen) – Auftragsverarbeiter</li>
  <li><strong>Datenbank- und Sicherheitsdienstleister</strong> (EWR) – Auftragsverarbeiter</li>
  <li><strong>Finanzpartner</strong> (Kreditinstitute, Makler, Servicevermittler) (EWR) – Gemeinsam Verantwortliche</li>
</ol>

<h2>6. IHRE RECHTE</h2>
<p><strong>Auskunft:</strong> Sie haben das Recht, Informationen über die Verarbeitung Ihrer Daten zu erhalten, einschließlich Datenkategorien, Empfänger, Speicherfristen und Übertragungsschutzmaßnahmen.</p>
<p><strong>Berichtigung:</strong> Sie können die Korrektur unrichtiger oder unvollständiger personenbezogener Daten verlangen.</p>
<p><strong>Löschung:</strong> Sie können die Löschung Ihrer personenbezogenen Daten ohne unangemessene Verzögerung verlangen.</p>
<p><strong>Einschränkung:</strong> Sie können die Einschränkung der Verarbeitung Ihrer Daten verlangen.</p>
<p><strong>Datenübertragbarkeit:</strong> Sie haben das Recht, Ihre Daten in einem strukturierten, maschinenlesbaren Format zu erhalten.</p>
<p><strong>Widerspruch:</strong> Sie können der Verarbeitung auf Grundlage berechtigter Interessen oder öffentlicher Interessen widersprechen.</p>
<p><strong>Widerruf der Einwilligung:</strong> Sie können eine erteilte Einwilligung jederzeit widerrufen.</p>
<p><strong>Beschwerde:</strong> Sie können eine Beschwerde bei der zuständigen Aufsichtsbehörde einreichen: ${d.dpaName} — ${d.dpaPhone}.</p>
<p><strong>Kontakt:</strong> <a href="mailto:${COMPANY_EMAIL}">${COMPANY_EMAIL}</a>. Wir antworten innerhalb eines Monats nach Eingang Ihrer Anfrage.</p>
<p><strong>Marketing-Abmeldung:</strong> Verwenden Sie den Abmeldelink in jeder Marketingkommunikation oder klicken Sie <a href="${d.unsubUrl}">hier</a>.</p>

<h2>7. ÄNDERUNGEN DIESER DATENSCHUTZERKLÄRUNG</h2>
<p>Wesentliche Änderungen dieser Datenschutzerklärung werden vor deren Inkrafttreten per Push-Benachrichtigung, SMS oder E-Mail mitgeteilt.</p>
`);
}

function ruTemplate(d: CountryPolicyData): string {
    return pageWrapper('ru', 'Политика конфиденциальности – Finmatcher', `
<h1>ПОЛИТИКА КОНФИДЕНЦИАЛЬНОСТИ</h1>
<p class="version">Версия 2, 4 августа 2025 г.</p>

<h2>1. ВВЕДЕНИЕ</h2>
<p>ADSKI ценит вашу конфиденциальность и обеспечивает ответственную обработку персональных данных. Настоящая Политика конфиденциальности описывает основные принципы и условия обработки ваших персональных данных, а также реализованные меры безопасности.</p>
<p>Политика распространяется на веб-сайт и приложения Finmatcher, включая маркетинговые коммуникации, продвигающие наши услуги.</p>

<h2>2. КОНТАКТНЫЕ ДАННЫЕ ОПЕРАТОРА</h2>
<p>ADSKI OÜ является оператором персональных данных, если не указано иное.</p>
<address>
  <strong>Почтовый адрес:</strong> ${COMPANY_ADDRESS}<br>
  <strong>Электронная почта:</strong> <a href="mailto:${COMPANY_EMAIL}">${COMPANY_EMAIL}</a>
</address>

<h2>3. ОБРАБОТКА ДАННЫХ: ЦЕЛИ, ПРАВОВЫЕ ОСНОВАНИЯ И СРОКИ ХРАНЕНИЯ</h2>
<p>ADSKI действует как оператор данных, самостоятельно определяя цели обработки и выбирая соответствующие инструменты.</p>
<p><strong>Деятельность по обработке включает:</strong></p>
<ul>
  <li>Регистрация аккаунта (email, имя, данные доступа через прямую подачу или сторонние аутентификаторы)</li>
  <li>Идентификация и авторизация пользователя</li>
  <li>Сохранение избранных предложений и сравнение финансовых продуктов</li>
  <li>Проверка возраста</li>
  <li>Подготовка и отправка заявок на кредит в финансовые учреждения</li>
  <li>Продвижение предварительных кредитных предложений</li>
  <li>Уведомления о ходе выполнения услуг</li>
  <li>Поддержка клиентов</li>
  <li>Сбор обратной связи</li>
  <li>Управление клиентским опытом</li>
  <li>Маркетинг (email, push, SMS, мессенджеры)</li>
  <li>Безопасность и предотвращение мошенничества</li>
  <li>Защита законных прав и разрешение споров</li>
</ul>
<p><strong>Категории собираемых данных:</strong></p>
<ul>
  <li>Персональные идентификационные данные (имя, дата рождения, номера из ${d.idDocument})</li>
  <li>Контактная информация (email, телефон, адрес)</li>
  <li>Финансовая информация (доходы, расходы, банковские счета)</li>
  <li>Сведения о занятости</li>
  <li>Семейное положение и условия проживания</li>
  <li>История образования</li>
  <li>Иные финансовые обязательства</li>
</ul>
<p><strong>Сроки хранения:</strong> Данные обрабатываются до выполнения заявленных целей.</p>

<h2>4. АВТОМАТИЗИРОВАННОЕ ПРИНЯТИЕ РЕШЕНИЙ</h2>
<p>Мы не используем автоматизированное принятие решений или автоматизированное профилирование для оценки аспектов вашей личности.</p>

<h2>5. ПЕРЕДАЧА ДАННЫХ ТРЕТЬИМ ЛИЦАМ</h2>
<p>Передача данных требует надлежащих технических и организационных мер защиты посредством договоров с обязательными требованиями по защите данных.</p>
<p>Трансграничная передача данных в третьи страны требует надлежащего уровня защиты. В случае его недостаточности применяются соответствующие гарантии и оценки воздействия трансфера (TIA).</p>
<p><strong>Категории третьих лиц:</strong></p>
<ol>
  <li><strong>Поставщик IT-услуг email-маркетинга</strong> (ЕЭЗ) – Обработчик</li>
  <li><strong>Провайдер веб-хостинга</strong> (США / участник Рамочного соглашения ЕС–США, Бельгия) – Обработчик</li>
  <li><strong>Провайдеры аналитики cookie</strong> (США / Рамочное соглашение ЕС–США) – Обработчики</li>
  <li><strong>Провайдер управления базами данных и безопасности</strong> (ЕЭЗ) – Обработчик</li>
  <li><strong>Финансовые партнёры</strong> (кредитные организации, брокеры, посредники) (ЕЭЗ) – Совместные операторы</li>
</ol>

<h2>6. ВАШИ ПРАВА</h2>
<p><strong>Доступ:</strong> Вы вправе получить информацию об обработке ваших данных, включая категории данных, получателей, сроки хранения и гарантии при передаче.</p>
<p><strong>Исправление:</strong> Вы можете запросить исправление неточных или неполных персональных данных.</p>
<p><strong>Удаление:</strong> Вы можете запросить удаление ваших персональных данных без неоправданной задержки.</p>
<p><strong>Ограничение:</strong> Вы можете запросить ограничение обработки ваших данных.</p>
<p><strong>Переносимость данных:</strong> Вы вправе получить свои данные в структурированном, машиночитаемом формате.</p>
<p><strong>Возражение:</strong> Вы можете возразить против обработки на основании законных интересов или общественных интересов.</p>
<p><strong>Отзыв согласия:</strong> Вы можете отозвать согласие в любое время для обработки, основанной на согласии.</p>
<p><strong>Жалоба:</strong> Вы можете подать жалобу в уполномоченный надзорный орган: ${d.dpaName} — ${d.dpaPhone}.</p>
<p><strong>Связь с нами:</strong> <a href="mailto:${COMPANY_EMAIL}">${COMPANY_EMAIL}</a>. Мы ответим в течение одного месяца с момента получения вашего запроса.</p>
<p><strong>Отказ от маркетинга:</strong> Используйте ссылку для отписки в любом маркетинговом сообщении или нажмите <a href="${d.unsubUrl}">здесь</a>.</p>

<h2>7. ИЗМЕНЕНИЯ В ПОЛИТИКЕ</h2>
<p>Существенные изменения в настоящей Политике конфиденциальности будут сообщены посредством push-уведомлений, SMS или электронной почты до их вступления в силу.</p>
`);
}

function msTemplate(d: CountryPolicyData): string {
    return pageWrapper('ms', 'Dasar Privasi – Finmatcher', `
<h1>DASAR PRIVASI</h1>
<p class="version">Versi 2, 4 Ogos 2025</p>

<h2>1. PENGENALAN</h2>
<p>ADSKI menghargai privasi anda dan komited untuk memproses data peribadi anda secara bertanggungjawab. Dasar Privasi ini menggariskan prinsip dan terma asas yang mengawal pengendalian data peribadi anda, serta langkah keselamatan yang telah kami laksanakan.</p>
<p>Dasar ini terpakai kepada laman web dan aplikasi Finmatcher, termasuk komunikasi pemasaran yang mempromosikan perkhidmatan kami.</p>

<h2>2. MAKLUMAT HUBUNGAN PENGAWAL DATA</h2>
<p>ADSKI OÜ bertindak sebagai pengawal data melainkan dinyatakan sebaliknya.</p>
<address>
  <strong>Alamat Pos:</strong> ${COMPANY_ADDRESS}<br>
  <strong>E-mel:</strong> <a href="mailto:${COMPANY_EMAIL}">${COMPANY_EMAIL}</a>
</address>

<h2>3. PEMPROSESAN DATA: TUJUAN, ASAS UNDANG-UNDANG &amp; PENGEKALAN</h2>
<p>ADSKI bertindak sebagai pengawal data, menentukan tujuan pemprosesan secara bebas dan memilih alat yang sesuai.</p>
<p><strong>Aktiviti pemprosesan termasuk:</strong></p>
<ul>
  <li>Pendaftaran akaun (e-mel, nama, data akses melalui penyerahan langsung atau pengesah pihak ketiga)</li>
  <li>Pengenalpastian dan pengesahan pengguna</li>
  <li>Menyimpan tawaran kegemaran dan membandingkan produk kewangan</li>
  <li>Pengesahan umur</li>
  <li>Penyediaan dan penyerahan permohonan pinjaman kepada institusi kredit</li>
  <li>Promosi tawaran kredit awal</li>
  <li>Pemberitahuan kemajuan perkhidmatan</li>
  <li>Sokongan pelanggan</li>
  <li>Pengumpulan maklum balas</li>
  <li>Pengurusan pengalaman pelanggan</li>
  <li>Pemasaran (e-mel, push, SMS, aplikasi pesanan)</li>
  <li>Keselamatan dan pencegahan penipuan</li>
  <li>Perlindungan hak undang-undang dan penyelesaian pertikaian</li>
</ul>
<p><strong>Kategori data yang dikumpul:</strong></p>
<ul>
  <li>Butiran pengenalan peribadi (nama, tarikh lahir, nombor pengenalan daripada ${d.idDocument})</li>
  <li>Maklumat hubungan (e-mel, telefon, alamat)</li>
  <li>Maklumat kewangan (pendapatan, perbelanjaan, akaun bank)</li>
  <li>Butiran pekerjaan</li>
  <li>Situasi keluarga dan kediaman</li>
  <li>Sejarah pendidikan</li>
  <li>Obligasi kewangan lain</li>
</ul>
<p><strong>Pengekalan:</strong> Data peribadi diproses sehingga tujuan yang dinyatakan dipenuhi.</p>

<h2>4. KEPUTUSAN AUTOMATIK</h2>
<p>Kami tidak menggunakan keputusan automatik atau pemprofilan automatik untuk menilai aspek personaliti anda.</p>

<h2>5. PERKONGSIAN DATA DENGAN PIHAK KETIGA</h2>
<p>Pemindahan data memerlukan perlindungan teknikal dan organisasi yang mencukupi melalui kontrak dengan kewajipan perlindungan data yang mengikat.</p>
<p>Pemindahan rentas sempadan ke negara ketiga memerlukan tahap perlindungan yang mencukupi. Di mana tahap tersebut tidak mencukupi, perlindungan yang sesuai dan Penilaian Impak Pemindahan (TIA) akan dilaksanakan.</p>
<p><strong>Kategori pihak ketiga:</strong></p>
<ol>
  <li><strong>Pembekal IT pemasaran e-mel</strong> (EEA) – Pemproses</li>
  <li><strong>Pembekal pengehosan web</strong> (AS / peserta Rangka Kerja Privasi Data EU–AS, Belgium) – Pemproses</li>
  <li><strong>Pembekal analitik kuki</strong> (AS / Rangka Kerja Privasi Data EU–AS) – Pemproses</li>
  <li><strong>Pembekal pengurusan pangkalan data dan keselamatan</strong> (EEA) – Pemproses</li>
  <li><strong>Rakan kongsi kewangan</strong> (institusi kredit, broker, pengantara perkhidmatan) (EEA) – Pengawal Bersama</li>
</ol>

<h2>6. HAK ANDA</h2>
<p><strong>Akses:</strong> Anda berhak mendapatkan maklumat tentang pemprosesan data anda, termasuk kategori data, penerima, tempoh pengekalan dan perlindungan pemindahan.</p>
<p><strong>Pembetulan:</strong> Anda boleh meminta pembetulan data peribadi yang tidak tepat atau tidak lengkap.</p>
<p><strong>Pemadaman:</strong> Anda boleh meminta pemadaman data peribadi anda tanpa kelewatan yang tidak wajar.</p>
<p><strong>Sekatan:</strong> Anda boleh meminta sekatan pemprosesan data anda.</p>
<p><strong>Kemudahalihan Data:</strong> Anda berhak menerima data anda dalam format berstruktur yang boleh dibaca oleh mesin.</p>
<p><strong>Bantahan:</strong> Anda boleh membantah pemprosesan berdasarkan kepentingan yang sah atau kepentingan awam.</p>
<p><strong>Penarikan Balik Persetujuan:</strong> Anda boleh menarik balik persetujuan pada bila-bila masa untuk pemprosesan berasaskan persetujuan.</p>
<p><strong>Aduan:</strong> Anda boleh membuat aduan kepada pihak berkuasa penyeliaan yang kompeten: ${d.dpaName} — ${d.dpaPhone}.</p>
<p><strong>Hubungi kami:</strong> <a href="mailto:${COMPANY_EMAIL}">${COMPANY_EMAIL}</a>. Kami akan menjawab dalam masa satu bulan selepas menerima permintaan anda.</p>
<p><strong>Pilih keluar pemasaran:</strong> Gunakan pautan nyahlanggan dalam sebarang komunikasi pemasaran atau klik <a href="${d.unsubUrl}">di sini</a>.</p>

<h2>7. PERUBAHAN PADA DASAR INI</h2>
<p>Perubahan penting pada Dasar Privasi ini akan dimaklumkan melalui pemberitahuan push, SMS atau e-mel sebelum berkuat kuasa.</p>
`);
}

function roTemplate(d: CountryPolicyData): string {
    return pageWrapper('ro', 'Politică de Confidențialitate – Finmatcher', `
<h1>POLITICĂ DE CONFIDENȚIALITATE</h1>
<p class="version">Versiunea 2, 4 august 2025</p>

<h2>1. INTRODUCERE</h2>
<p>ADSKI acordă o importanță deosebită confidențialității dumneavoastră și se angajează să prelucreze responsabil datele dumneavoastră cu caracter personal. Această Politică de Confidențialitate descrie principiile și condițiile de bază care reglementează prelucrarea datelor dumneavoastră, precum și măsurile de securitate implementate.</p>
<p>Politica se aplică site-ului web și aplicațiilor Finmatcher, inclusiv comunicărilor de marketing care promovează serviciile noastre.</p>

<h2>2. DATELE DE CONTACT ALE OPERATORULUI</h2>
<p>ADSKI OÜ acționează în calitate de operator de date cu caracter personal, cu excepția cazului în care se specifică altfel.</p>
<address>
  <strong>Adresă poștală:</strong> ${COMPANY_ADDRESS}<br>
  <strong>E-mail:</strong> <a href="mailto:${COMPANY_EMAIL}">${COMPANY_EMAIL}</a>
</address>

<h2>3. PRELUCRAREA DATELOR: SCOPURI, TEMEIURI LEGALE &amp; STOCARE</h2>
<p>ADSKI acționează ca operator de date, stabilind în mod autonom scopurile prelucrării și selectând instrumentele adecvate.</p>
<p><strong>Activitățile de prelucrare includ:</strong></p>
<ul>
  <li>Înregistrarea contului (e-mail, nume, date de acces prin trimitere directă sau autentificatori terți)</li>
  <li>Identificarea și autorizarea utilizatorului</li>
  <li>Salvarea ofertelor favorite și compararea produselor financiare</li>
  <li>Verificarea vârstei</li>
  <li>Pregătirea și transmiterea cererilor de credit către instituțiile de credit</li>
  <li>Promovarea ofertelor de credit preliminare</li>
  <li>Notificări privind stadiul serviciilor</li>
  <li>Suport pentru clienți</li>
  <li>Colectarea feedback-ului</li>
  <li>Gestionarea experienței clienților</li>
  <li>Marketing (e-mail, push, SMS, aplicații de mesagerie)</li>
  <li>Securitate și prevenirea fraudei</li>
  <li>Protejarea drepturilor legale și soluționarea litigiilor</li>
</ul>
<p><strong>Categorii de date colectate:</strong></p>
<ul>
  <li>Date de identificare personală (nume, dată de naștere, numere de identificare din ${d.idDocument})</li>
  <li>Informații de contact (e-mail, telefon, adresă)</li>
  <li>Informații financiare (venituri, cheltuieli, conturi bancare)</li>
  <li>Date despre angajare</li>
  <li>Situația familială și locuință</li>
  <li>Istoricul educațional</li>
  <li>Alte obligații financiare</li>
</ul>
<p><strong>Stocare:</strong> Datele cu caracter personal sunt prelucrate până la îndeplinirea scopurilor declarate.</p>

<h2>4. DECIZII AUTOMATE</h2>
<p>Nu utilizăm decizii automatizate sau profilare automatizată pentru a evalua aspecte ale personalității dumneavoastră.</p>

<h2>5. PARTAJAREA DATELOR CU TERȚI</h2>
<p>Transferurile de date necesită măsuri tehnice și organizatorice adecvate prin contracte cu obligații obligatorii de protecție a datelor.</p>
<p>Transferurile transfrontaliere către țări terțe necesită niveluri adecvate de protecție. Acolo unde acestea sunt insuficiente, se implementează garanții corespunzătoare și Evaluări ale Impactului Transferului (TIA).</p>
<p><strong>Categorii de terți:</strong></p>
<ol>
  <li><strong>Furnizor IT de e-mail marketing</strong> (SEE) – Persoană împuternicită</li>
  <li><strong>Furnizor de găzduire web</strong> (SUA / participant la Cadrul de confidențialitate a datelor UE–SUA, Belgia) – Persoană împuternicită</li>
  <li><strong>Furnizori de analize cookie</strong> (SUA / Cadrul de confidențialitate UE–SUA) – Persoane împuternicite</li>
  <li><strong>Furnizor de gestionare a bazelor de date și securitate</strong> (SEE) – Persoană împuternicită</li>
  <li><strong>Parteneri financiari</strong> (instituții de credit, brokeri, intermediari de servicii) (SEE) – Operatori asociați</li>
</ol>

<h2>6. DREPTURILE DUMNEAVOASTRĂ</h2>
<p><strong>Acces:</strong> Aveți dreptul de a obține informații despre prelucrarea datelor dumneavoastră, inclusiv categoriile de date, destinatarii, perioadele de stocare și garanțiile de transfer.</p>
<p><strong>Rectificare:</strong> Puteți solicita corectarea datelor cu caracter personal inexacte sau incomplete.</p>
<p><strong>Ștergere:</strong> Puteți solicita ștergerea datelor dumneavoastră fără întârzieri nejustificate.</p>
<p><strong>Restricționare:</strong> Puteți solicita restricționarea prelucrării datelor dumneavoastră.</p>
<p><strong>Portabilitate:</strong> Aveți dreptul de a primi datele dumneavoastră într-un format structurat, care poate fi citit automat.</p>
<p><strong>Opoziție:</strong> Vă puteți opune prelucrării bazate pe interes legitim sau interes public.</p>
<p><strong>Retragerea consimțământului:</strong> Vă puteți retrage consimțământul în orice moment pentru prelucrarea bazată pe consimțământ.</p>
<p><strong>Plângere:</strong> Puteți depune o plângere la autoritatea de supraveghere competentă: ${d.dpaName} — ${d.dpaPhone}.</p>
<p><strong>Contactați-ne:</strong> <a href="mailto:${COMPANY_EMAIL}">${COMPANY_EMAIL}</a>. Vom răspunde în termen de o lună de la primirea solicitării dumneavoastră.</p>
<p><strong>Dezabonare marketing:</strong> Utilizați linkul de dezabonare din orice comunicare de marketing sau faceți clic <a href="${d.unsubUrl}">aici</a>.</p>

<h2>7. MODIFICĂRI ALE ACESTEI POLITICI</h2>
<p>Modificările substanțiale ale acestei Politici de Confidențialitate vor fi comunicate prin notificări push, SMS sau e-mail înainte de intrarea în vigoare.</p>
`);
}

function ukTemplate(d: CountryPolicyData): string {
    return pageWrapper('uk', 'Політика конфіденційності – Finmatcher', `
<h1>ПОЛІТИКА КОНФІДЕНЦІЙНОСТІ</h1>
<p class="version">Версія 2, 4 серпня 2025 р.</p>

<h2>1. ВСТУП</h2>
<p>ADSKI цінує вашу конфіденційність і зобов'язується відповідально обробляти ваші персональні дані. Ця Політика конфіденційності описує основні принципи та умови обробки ваших персональних даних, а також запроваджені заходи безпеки.</p>
<p>Політика поширюється на веб-сайт і додатки Finmatcher, включно з маркетинговими комунікаціями, що просувають наші послуги.</p>

<h2>2. КОНТАКТНІ ДАНІ ОПЕРАТОРА</h2>
<p>ADSKI OÜ є оператором персональних даних, якщо не зазначено інше.</p>
<address>
  <strong>Поштова адреса:</strong> ${COMPANY_ADDRESS}<br>
  <strong>Електронна пошта:</strong> <a href="mailto:${COMPANY_EMAIL}">${COMPANY_EMAIL}</a>
</address>

<h2>3. ОБРОБКА ДАНИХ: ЦІЛІ, ПРАВОВІ ПІДСТАВИ ТА СТРОКИ ЗБЕРІГАННЯ</h2>
<p>ADSKI діє як оператор даних, самостійно визначаючи цілі обробки та обираючи відповідні засоби.</p>
<p><strong>Діяльність з обробки включає:</strong></p>
<ul>
  <li>Реєстрація облікового запису (email, ім'я, дані доступу через пряме подання або сторонні автентифікатори)</li>
  <li>Ідентифікація та авторизація користувача</li>
  <li>Збереження обраних пропозицій та порівняння фінансових продуктів</li>
  <li>Перевірка віку</li>
  <li>Підготовка та подання заявок на кредит до фінансових установ</li>
  <li>Просування попередніх кредитних пропозицій</li>
  <li>Сповіщення про хід надання послуг</li>
  <li>Підтримка клієнтів</li>
  <li>Збір відгуків</li>
  <li>Управління клієнтським досвідом</li>
  <li>Маркетинг (email, push, SMS, месенджери)</li>
  <li>Безпека та запобігання шахрайству</li>
  <li>Захист законних прав і вирішення спорів</li>
</ul>
<p><strong>Категорії даних, що збираються:</strong></p>
<ul>
  <li>Персональні ідентифікаційні дані (ім'я, дата народження, номери з ${d.idDocument})</li>
  <li>Контактна інформація (email, телефон, адреса)</li>
  <li>Фінансова інформація (доходи, витрати, банківські рахунки)</li>
  <li>Відомості про зайнятість</li>
  <li>Сімейний стан і умови проживання</li>
  <li>Освітня історія</li>
  <li>Інші фінансові зобов'язання</li>
</ul>
<p><strong>Строки зберігання:</strong> Дані обробляються до виконання зазначених цілей.</p>

<h2>4. АВТОМАТИЗОВАНЕ ПРИЙНЯТТЯ РІШЕНЬ</h2>
<p>Ми не використовуємо автоматизоване прийняття рішень або автоматизоване профілювання для оцінки аспектів вашої особистості.</p>

<h2>5. ПЕРЕДАЧА ДАНИХ ТРЕТІМ ОСОБАМ</h2>
<p>Передача даних вимагає належних технічних і організаційних гарантій через договори з обов'язковими вимогами щодо захисту даних.</p>
<p>Транскордонна передача даних до третіх країн вимагає належного рівня захисту. У разі його недостатності застосовуються відповідні гарантії та оцінки впливу передачі (TIA).</p>
<p><strong>Категорії третіх осіб:</strong></p>
<ol>
  <li><strong>IT-постачальник email-маркетингу</strong> (ЄЕП) – Обробник</li>
  <li><strong>Провайдер веб-хостингу</strong> (США / учасник Рамкової угоди ЄС–США, Бельгія) – Обробник</li>
  <li><strong>Постачальники аналітики cookie</strong> (США / Рамкова угода ЄС–США) – Обробники</li>
  <li><strong>Постачальник управління базами даних і безпеки</strong> (ЄЕП) – Обробник</li>
  <li><strong>Фінансові партнери</strong> (кредитні установи, брокери, посередники) (ЄЕП) – Спільні оператори</li>
</ol>

<h2>6. ВАШІ ПРАВА</h2>
<p><strong>Доступ:</strong> Ви маєте право отримати інформацію про обробку ваших даних, включаючи категорії даних, одержувачів, строки зберігання та гарантії при передачі.</p>
<p><strong>Виправлення:</strong> Ви можете запросити виправлення неточних або неповних персональних даних.</p>
<p><strong>Видалення:</strong> Ви можете запросити видалення ваших персональних даних без невиправданої затримки.</p>
<p><strong>Обмеження:</strong> Ви можете запросити обмеження обробки ваших даних.</p>
<p><strong>Переносимість даних:</strong> Ви маєте право отримати свої дані у структурованому, машинозчитуваному форматі.</p>
<p><strong>Заперечення:</strong> Ви можете заперечити проти обробки на підставі законних інтересів або суспільних інтересів.</p>
<p><strong>Відкликання згоди:</strong> Ви можете відкликати згоду в будь-який час для обробки на основі згоди.</p>
<p><strong>Скарга:</strong> Ви можете подати скаргу до уповноваженого наглядового органу: ${d.dpaName} — ${d.dpaPhone}.</p>
<p><strong>Зв'яжіться з нами:</strong> <a href="mailto:${COMPANY_EMAIL}">${COMPANY_EMAIL}</a>. Ми відповімо протягом одного місяця з моменту отримання вашого запиту.</p>
<p><strong>Відмова від маркетингу:</strong> Скористайтеся посиланням для відписки в будь-якому маркетинговому повідомленні або натисніть <a href="${d.unsubUrl}">тут</a>.</p>

<h2>7. ЗМІНИ ДО ЦІЄЇ ПОЛІТИКИ</h2>
<p>Суттєві зміни до цієї Політики конфіденційності будуть повідомлені через push-сповіщення, SMS або електронну пошту до їх набрання чинності.</p>
`);
}

function viTemplate(d: CountryPolicyData): string {
    return pageWrapper('vi', 'Chính sách Bảo mật – Finmatcher', `
<h1>CHÍNH SÁCH BẢO MẬT</h1>
<p class="version">Phiên bản 2, ngày 4 tháng 8 năm 2025</p>

<h2>1. GIỚI THIỆU</h2>
<p>ADSKI coi trọng sự riêng tư của bạn và cam kết xử lý dữ liệu cá nhân của bạn một cách có trách nhiệm. Chính sách Bảo mật này mô tả các nguyên tắc và điều khoản cơ bản chi phối việc xử lý dữ liệu cá nhân của bạn, cũng như các biện pháp bảo mật chúng tôi đã triển khai.</p>
<p>Chính sách này áp dụng cho trang web và ứng dụng Finmatcher, bao gồm các thông tin liên lạc tiếp thị quảng bá dịch vụ của chúng tôi.</p>

<h2>2. THÔNG TIN LIÊN HỆ CỦA BÊN KIỂM SOÁT DỮ LIỆU</h2>
<p>ADSKI OÜ đóng vai trò là bên kiểm soát dữ liệu trừ khi có quy định khác.</p>
<address>
  <strong>Địa chỉ bưu điện:</strong> ${COMPANY_ADDRESS}<br>
  <strong>Email:</strong> <a href="mailto:${COMPANY_EMAIL}">${COMPANY_EMAIL}</a>
</address>

<h2>3. XỬ LÝ DỮ LIỆU: MỤC ĐÍCH, CĂN CỨ PHÁP LÝ &amp; THỜI HẠN LƯU TRỮ</h2>
<p>ADSKI đóng vai trò là bên kiểm soát dữ liệu, tự chủ xác định mục đích xử lý và lựa chọn công cụ phù hợp.</p>
<p><strong>Các hoạt động xử lý bao gồm:</strong></p>
<ul>
  <li>Đăng ký tài khoản (email, tên, dữ liệu truy cập qua nộp trực tiếp hoặc trình xác thực bên thứ ba)</li>
  <li>Xác định và ủy quyền người dùng</li>
  <li>Lưu ưu đãi yêu thích và so sánh sản phẩm tài chính</li>
  <li>Xác minh độ tuổi</li>
  <li>Chuẩn bị và nộp đơn xin vay cho các tổ chức tín dụng</li>
  <li>Quảng bá các ưu đãi tín dụng sơ bộ</li>
  <li>Thông báo tiến độ dịch vụ</li>
  <li>Hỗ trợ khách hàng</li>
  <li>Thu thập phản hồi</li>
  <li>Quản lý trải nghiệm khách hàng</li>
  <li>Tiếp thị (email, push, SMS, ứng dụng nhắn tin)</li>
  <li>Bảo mật và phòng chống gian lận</li>
  <li>Bảo vệ quyền pháp lý và giải quyết tranh chấp</li>
</ul>
<p><strong>Các danh mục dữ liệu được thu thập:</strong></p>
<ul>
  <li>Thông tin nhận dạng cá nhân (tên, ngày sinh, số từ ${d.idDocument})</li>
  <li>Thông tin liên hệ (email, điện thoại, địa chỉ)</li>
  <li>Thông tin tài chính (thu nhập, chi tiêu, tài khoản ngân hàng)</li>
  <li>Chi tiết việc làm</li>
  <li>Tình trạng gia đình và nơi ở</li>
  <li>Lịch sử học vấn</li>
  <li>Các nghĩa vụ tài chính khác</li>
</ul>
<p><strong>Thời hạn lưu trữ:</strong> Dữ liệu cá nhân được xử lý cho đến khi hoàn thành các mục đích đã nêu.</p>

<h2>4. QUYẾT ĐỊNH TỰ ĐỘNG</h2>
<p>Chúng tôi không sử dụng quyết định tự động hoặc lập hồ sơ tự động để đánh giá các khía cạnh tính cách của bạn.</p>

<h2>5. CHIA SẺ DỮ LIỆU VỚI BÊN THỨ BA</h2>
<p>Việc chuyển giao dữ liệu đòi hỏi các biện pháp bảo vệ kỹ thuật và tổ chức đầy đủ thông qua các hợp đồng có nghĩa vụ bảo vệ dữ liệu ràng buộc.</p>
<p>Việc chuyển giao xuyên biên giới sang các nước thứ ba đòi hỏi mức độ bảo vệ đầy đủ. Khi không đạt yêu cầu, sẽ triển khai các biện pháp bảo vệ phù hợp và Đánh giá tác động chuyển giao (TIA).</p>
<p><strong>Danh mục bên thứ ba:</strong></p>
<ol>
  <li><strong>Nhà cung cấp IT tiếp thị qua email</strong> (EEA) – Bên xử lý</li>
  <li><strong>Nhà cung cấp dịch vụ lưu trữ web</strong> (Mỹ / tham gia Khung bảo mật dữ liệu EU–Mỹ, Bỉ) – Bên xử lý</li>
  <li><strong>Nhà cung cấp phân tích cookie</strong> (Mỹ / Khung bảo mật dữ liệu EU–Mỹ) – Bên xử lý</li>
  <li><strong>Nhà cung cấp quản lý cơ sở dữ liệu và bảo mật</strong> (EEA) – Bên xử lý</li>
  <li><strong>Đối tác tài chính</strong> (tổ chức tín dụng, nhà môi giới, trung gian dịch vụ) (EEA) – Đồng kiểm soát</li>
</ol>

<h2>6. QUYỀN CỦA BẠN</h2>
<p><strong>Truy cập:</strong> Bạn có quyền lấy thông tin về việc xử lý dữ liệu của mình, bao gồm danh mục dữ liệu, người nhận, thời hạn lưu trữ và biện pháp bảo vệ khi chuyển giao.</p>
<p><strong>Chỉnh sửa:</strong> Bạn có thể yêu cầu sửa dữ liệu cá nhân không chính xác hoặc chưa đầy đủ.</p>
<p><strong>Xóa:</strong> Bạn có thể yêu cầu xóa dữ liệu cá nhân của mình mà không có sự chậm trễ không hợp lý.</p>
<p><strong>Hạn chế:</strong> Bạn có thể yêu cầu hạn chế xử lý dữ liệu của mình.</p>
<p><strong>Chuyển dữ liệu:</strong> Bạn có quyền nhận dữ liệu của mình ở định dạng có cấu trúc, có thể đọc bằng máy.</p>
<p><strong>Phản đối:</strong> Bạn có thể phản đối việc xử lý dựa trên lợi ích hợp pháp hoặc lợi ích công cộng.</p>
<p><strong>Rút lại sự đồng ý:</strong> Bạn có thể rút lại sự đồng ý bất cứ lúc nào đối với việc xử lý dựa trên sự đồng ý.</p>
<p><strong>Khiếu nại:</strong> Bạn có thể gửi khiếu nại đến cơ quan giám sát có thẩm quyền: ${d.dpaName} — ${d.dpaPhone}.</p>
<p><strong>Liên hệ với chúng tôi:</strong> <a href="mailto:${COMPANY_EMAIL}">${COMPANY_EMAIL}</a>. Chúng tôi sẽ phản hồi trong vòng một tháng kể từ khi nhận được yêu cầu của bạn.</p>
<p><strong>Hủy đăng ký tiếp thị:</strong> Sử dụng liên kết hủy đăng ký trong bất kỳ thông tin tiếp thị nào hoặc nhấp <a href="${d.unsubUrl}">vào đây</a>.</p>

<h2>7. THAY ĐỔI CHÍNH SÁCH NÀY</h2>
<p>Các thay đổi quan trọng đối với Chính sách Bảo mật này sẽ được thông báo qua thông báo đẩy, SMS hoặc email trước khi có hiệu lực.</p>
`);
}

const templateFns: Record<string, (d: CountryPolicyData) => string> = {
    en: enTemplate,
    es: esTemplate,
    de: deTemplate,
    ru: ruTemplate,
    ms: msTemplate,
    ro: roTemplate,
    uk: ukTemplate,
    vi: viTemplate,
};

export function getPrivacyPolicy() {
    return (req: Request, res: Response) => {
        const code = (req.params.code ?? '').toLowerCase();
        const data = countryPolicies[code];
        if (!data) {
            res.status(404).type('text/plain').send('Privacy policy not available for this region.');
            return;
        }
        const html = templateFns[data.template](data);
        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        res.send(html);
    };
}
