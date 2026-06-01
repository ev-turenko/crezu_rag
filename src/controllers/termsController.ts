import { Request, Response } from 'express';

const COMPANY_NAME = 'ADSKI OÜ';
const COMPANY_REG = '16177539';
const COMPANY_ADDRESS = 'Harju maakond, Tallinn, Kesklinna linnaosa, Tartu mnt 52/1-166, 10115, Estonia';
const COMPANY_EMAIL = 'info@finmatcher.com';

type TermsTemplate = 'en' | 'es' | 'de' | 'ru' | 'ms' | 'ro' | 'uk' | 'vi';

const countryTermsTemplates: Record<string, TermsTemplate> = {
    co: 'es', de: 'de', kz: 'ru', lk: 'en', my: 'ms',
    pe: 'es', ph: 'en', ro: 'ro', ua: 'uk', vn: 'vi', za: 'en',
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
  h3 { font-size: 1rem; margin-top: 1.2rem; margin-bottom: 0.3rem; }
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

function enTemplate(): string {
    return pageWrapper('en', 'Terms and Conditions – Finmatcher', `
<h1>TERMS AND CONDITIONS</h1>
<p class="version">Version 1, May 30, 2026</p>

<h2>1. GENERAL PROVISIONS</h2>
<p>These Terms and Conditions govern the contractual relationship between you (the user) and <strong>${COMPANY_NAME}</strong>, an Estonian company with registration number ${COMPANY_REG}, registered address: ${COMPANY_ADDRESS} (hereinafter "ADSKI" or "we").</p>
<p>These terms apply to your use of the Finmatcher website and mobile application (collectively, the "Service"). By accessing or using the Service, you agree to be bound by these Terms.</p>
<p>We reserve the right to modify these Terms at any time. Continued use of the Service following notification of changes constitutes acceptance of the updated Terms.</p>
<p>These Terms are governed by applicable local laws. In the absence of applicable local provisions, Estonian law shall apply.</p>
<p>For any questions, contact us at: <a href="mailto:${COMPANY_EMAIL}">${COMPANY_EMAIL}</a></p>

<h2>2. SCOPE OF SERVICES</h2>

<h3>2.1 Account Registration and Use</h3>
<p>You may create a personal account to access the full range of features. You are responsible for maintaining the confidentiality of your login credentials. Please note that account deletion is irreversible and will result in permanent loss of your data.</p>

<h3>2.2 Credit Product Comparison</h3>
<p>The Service allows you to compare financial products from various providers. The displayed information is provided for informational purposes and does not constitute a binding offer.</p>

<h3>2.3 Informational Content</h3>
<p>We publish editorial articles on financial topics, product rankings, and guides. This content is intended for general informational purposes only and does not constitute financial advice.</p>

<h3>2.4 Preliminary Credit Offer Catalogue</h3>
<p>Displayed credit conditions are preliminary and indicative only. Actual terms are determined exclusively by the respective financial institution and may differ from those shown.</p>

<h3>2.5 Preliminary Loan Request</h3>
<p>The Service allows you to submit a preliminary loan request to our partner financial institutions. By doing so, you consent to the sharing of the information you provide with the relevant partners for the purpose of processing your request.</p>

<p>The Service is provided free of charge to users. ADSKI is not a financial institution, credit broker, or financial adviser. We do not provide credit or financial services directly.</p>

<h2>3. SERVICE USE RULES</h2>
<p>Use of the Service is restricted to persons aged 18 and over.</p>
<p>The following actions are strictly prohibited:</p>
<ul>
  <li>Impersonating another person or organisation</li>
  <li>Providing false, inaccurate, or misleading information</li>
  <li>Any fraudulent, abusive, or deceptive conduct</li>
  <li>Attempting to gain unauthorised access to our systems or data</li>
  <li>Interfering with or disrupting the operation of the Service</li>
  <li>Using the Service for any purpose that violates applicable law</li>
</ul>
<p>We reserve the right to suspend or terminate access to the Service for any user who violates these rules, without prior notice.</p>

<h2>4. LIMITATION OF LIABILITY</h2>
<p>The Service is provided on an "as is" and "as available" basis without warranties of any kind, whether express or implied, including but not limited to warranties of merchantability, fitness for a particular purpose, or non-infringement.</p>

<h3>4.1 General Liability</h3>
<p>To the maximum extent permitted by applicable law, ADSKI shall not be liable for any direct, indirect, incidental, special, or consequential damages arising from your use of, or inability to use, the Service.</p>

<h3>4.2 Content Responsibility</h3>
<p>ADSKI does not warrant the accuracy, completeness, or timeliness of any information published on the Service. You assume full responsibility for any decisions made based on information obtained through the Service.</p>

<h3>4.3 External Links</h3>
<p>The Service may contain links to third-party websites. ADSKI has no control over, and accepts no responsibility for, the content, privacy practices, or availability of those websites.</p>

<h2>5. INTELLECTUAL PROPERTY</h2>
<p>All elements of the Service, including but not limited to text, graphics, logos, icons, images, audio clips, and software, are the exclusive property of ADSKI or its licensors and are protected by applicable intellectual property laws.</p>
<p>We respect the intellectual property rights of third parties and expect users to do the same.</p>
<p>You may use the Service solely for private, non-commercial purposes. Reproduction, distribution, modification, or public display of any Service content without our prior written consent is prohibited.</p>

<h2>6. PERSONAL DATA PROTECTION</h2>
<p>We collect and process certain personal data in connection with your use of the Service. The details of how we handle your data, including the purposes, legal bases, retention periods, and your rights, are set out in our <a href="privacy-policy">Privacy Policy</a>.</p>
<p>We implement appropriate technical and organisational measures to protect your personal data against unauthorised access, disclosure, alteration, or destruction.</p>
`);
}

function esTemplate(): string {
    return pageWrapper('es', 'Términos y Condiciones – Finmatcher', `
<h1>TÉRMINOS Y CONDICIONES</h1>
<p class="version">Versión 1, 30 de mayo de 2026</p>

<h2>1. DISPOSICIONES GENERALES</h2>
<p>Los presentes Términos y Condiciones regulan la relación contractual entre usted (el usuario) y <strong>${COMPANY_NAME}</strong>, empresa estonia con número de registro ${COMPANY_REG}, domicilio social: ${COMPANY_ADDRESS} (en adelante "ADSKI" o "nosotros").</p>
<p>Estos términos se aplican al uso del sitio web y la aplicación móvil de Finmatcher (colectivamente, el "Servicio"). Al acceder o utilizar el Servicio, usted acepta quedar vinculado por estos Términos.</p>
<p>Nos reservamos el derecho de modificar estos Términos en cualquier momento. El uso continuado del Servicio tras la notificación de cambios constituye la aceptación de los Términos actualizados.</p>
<p>Estos Términos se rigen por las leyes locales aplicables. En ausencia de disposiciones locales aplicables, se aplicará la legislación estonia.</p>
<p>Para cualquier consulta, contáctenos en: <a href="mailto:${COMPANY_EMAIL}">${COMPANY_EMAIL}</a></p>

<h2>2. ALCANCE DE LOS SERVICIOS</h2>

<h3>2.1 Registro y uso de una cuenta personal</h3>
<p>Puede crear una cuenta personal para acceder a todas las funcionalidades del Servicio. Usted es responsable de mantener la confidencialidad de sus credenciales de acceso. Tenga en cuenta que la eliminación de la cuenta es irreversible y conllevará la pérdida permanente de sus datos.</p>

<h3>2.2 Comparación de productos de crédito</h3>
<p>El Servicio le permite comparar productos financieros de diversos proveedores. La información mostrada tiene únicamente fines informativos y no constituye una oferta vinculante.</p>

<h3>2.3 Contenido informativo</h3>
<p>Publicamos artículos editoriales sobre temas financieros, rankings de productos y guías. Este contenido tiene únicamente fines informativos generales y no constituye asesoramiento financiero.</p>

<h3>2.4 Catálogo de ofertas de crédito preliminares</h3>
<p>Las condiciones de crédito mostradas son únicamente preliminares e indicativas. Las condiciones reales las determina exclusivamente la entidad financiera correspondiente y pueden diferir de las mostradas.</p>

<h3>2.5 Solicitud preliminar de préstamo</h3>
<p>El Servicio le permite enviar una solicitud preliminar de préstamo a nuestras entidades financieras asociadas. Al hacerlo, usted consiente el intercambio de la información proporcionada con los socios correspondientes para el tratamiento de su solicitud.</p>

<p>El Servicio se presta de forma gratuita a los usuarios. ADSKI no es una entidad financiera, intermediario de crédito ni asesor financiero. No prestamos servicios de crédito ni financieros directamente.</p>

<h2>3. REGLAS DE USO DEL SERVICIO</h2>
<p>El uso del Servicio está restringido a personas mayores de 18 años.</p>
<p>Las siguientes acciones están estrictamente prohibidas:</p>
<ul>
  <li>Suplantar la identidad de otra persona u organización</li>
  <li>Proporcionar información falsa, inexacta o engañosa</li>
  <li>Cualquier conducta fraudulenta, abusiva o engañosa</li>
  <li>Intentar obtener acceso no autorizado a nuestros sistemas o datos</li>
  <li>Interferir o interrumpir el funcionamiento del Servicio</li>
  <li>Utilizar el Servicio para cualquier fin que infrinja la legislación aplicable</li>
</ul>
<p>Nos reservamos el derecho de suspender o cancelar el acceso al Servicio a cualquier usuario que incumpla estas normas, sin previo aviso.</p>

<h2>4. LIMITACIÓN DE RESPONSABILIDAD</h2>
<p>El Servicio se proporciona "tal cual" y "según disponibilidad", sin garantías de ningún tipo, ya sean expresas o implícitas, incluidas, entre otras, las garantías de comerciabilidad, idoneidad para un fin particular o no infracción.</p>

<h3>4.1 Responsabilidad general</h3>
<p>En la máxima medida permitida por la legislación aplicable, ADSKI no será responsable de ningún daño directo, indirecto, incidental, especial o consecuente derivado del uso del Servicio o de la imposibilidad de utilizarlo.</p>

<h3>4.2 Responsabilidad del contenido</h3>
<p>ADSKI no garantiza la exactitud, integridad ni actualidad de la información publicada en el Servicio. Usted asume plena responsabilidad por las decisiones tomadas basándose en la información obtenida a través del Servicio.</p>

<h3>4.3 Enlaces externos</h3>
<p>El Servicio puede contener enlaces a sitios web de terceros. ADSKI no tiene control ni acepta responsabilidad alguna sobre el contenido, las prácticas de privacidad o la disponibilidad de dichos sitios.</p>

<h2>5. DERECHOS DE PROPIEDAD INTELECTUAL</h2>
<p>Todos los elementos del Servicio, incluidos, entre otros, textos, gráficos, logotipos, iconos, imágenes, clips de audio y software, son propiedad exclusiva de ADSKI o sus licenciantes y están protegidos por las leyes de propiedad intelectual aplicables.</p>
<p>Respetamos los derechos de propiedad intelectual de terceros y esperamos que los usuarios hagan lo mismo.</p>
<p>Puede utilizar el Servicio únicamente con fines privados y no comerciales. Queda prohibida la reproducción, distribución, modificación o exposición pública de cualquier contenido del Servicio sin nuestro consentimiento previo por escrito.</p>

<h2>6. PROTECCIÓN DE DATOS PERSONALES</h2>
<p>Recopilamos y tratamos determinados datos personales en relación con su uso del Servicio. Los detalles sobre cómo gestionamos sus datos, incluidos los fines, las bases legales, los plazos de conservación y sus derechos, se exponen en nuestra <a href="privacy-policy">Política de Privacidad</a>.</p>
<p>Aplicamos medidas técnicas y organizativas apropiadas para proteger sus datos personales contra el acceso, divulgación, alteración o destrucción no autorizados.</p>
`);
}

function deTemplate(): string {
    return pageWrapper('de', 'Allgemeine Geschäftsbedingungen – Finmatcher', `
<h1>ALLGEMEINE GESCHÄFTSBEDINGUNGEN</h1>
<p class="version">Version 1, 30. Mai 2026</p>

<h2>1. ALLGEMEINE BESTIMMUNGEN</h2>
<p>Diese Allgemeinen Geschäftsbedingungen regeln das Vertragsverhältnis zwischen Ihnen (dem Nutzer) und <strong>${COMPANY_NAME}</strong>, einem estnischen Unternehmen mit der Registrierungsnummer ${COMPANY_REG}, eingetragener Adresse: ${COMPANY_ADDRESS} (nachfolgend „ADSKI" oder „wir").</p>
<p>Diese Bedingungen gelten für die Nutzung der Finmatcher-Website und der mobilen Anwendung (zusammen der „Dienst"). Durch den Zugriff auf oder die Nutzung des Dienstes erklären Sie sich mit diesen Bedingungen einverstanden.</p>
<p>Wir behalten uns das Recht vor, diese Bedingungen jederzeit zu ändern. Die fortgesetzte Nutzung des Dienstes nach Bekanntmachung von Änderungen gilt als Zustimmung zu den aktualisierten Bedingungen.</p>
<p>Diese Bedingungen unterliegen dem anwendbaren lokalen Recht. In Ermangelung anwendbarer lokaler Vorschriften gilt estnisches Recht.</p>
<p>Bei Fragen kontaktieren Sie uns unter: <a href="mailto:${COMPANY_EMAIL}">${COMPANY_EMAIL}</a></p>

<h2>2. LEISTUNGSUMFANG</h2>

<h3>2.1 Kontoregistrierung und -nutzung</h3>
<p>Sie können ein persönliches Konto erstellen, um alle Funktionen des Dienstes zu nutzen. Sie sind für die Geheimhaltung Ihrer Anmeldedaten verantwortlich. Bitte beachten Sie, dass die Kontolöschung unwiderruflich ist und zum dauerhaften Verlust Ihrer Daten führt.</p>

<h3>2.2 Vergleich von Kreditprodukten</h3>
<p>Der Dienst ermöglicht Ihnen den Vergleich von Finanzprodukten verschiedener Anbieter. Die angezeigten Informationen dienen ausschließlich Informationszwecken und stellen kein verbindliches Angebot dar.</p>

<h3>2.3 Informationsinhalte</h3>
<p>Wir veröffentlichen redaktionelle Artikel zu Finanzthemen, Produktrankings und Ratgeber. Diese Inhalte dienen ausschließlich allgemeinen Informationszwecken und stellen keine Finanzberatung dar.</p>

<h3>2.4 Katalog vorläufiger Kreditangebote</h3>
<p>Die angezeigten Kreditkonditionen sind ausschließlich vorläufig und indikativ. Die tatsächlichen Konditionen werden ausschließlich vom jeweiligen Kreditinstitut festgelegt und können von den angezeigten abweichen.</p>

<h3>2.5 Vorläufige Kreditanfrage</h3>
<p>Der Dienst ermöglicht Ihnen die Einreichung einer vorläufigen Kreditanfrage bei unseren Partnerfinanzinstituten. Damit erklären Sie sich einverstanden, dass die von Ihnen bereitgestellten Informationen zur Bearbeitung Ihrer Anfrage an die entsprechenden Partner weitergegeben werden.</p>

<p>Der Dienst ist für Nutzer kostenlos. ADSKI ist weder Kreditinstitut noch Kreditvermittler oder Finanzberater. Wir erbringen keine Kredit- oder Finanzdienstleistungen direkt.</p>

<h2>3. NUTZUNGSREGELN</h2>
<p>Die Nutzung des Dienstes ist Personen ab 18 Jahren vorbehalten.</p>
<p>Folgende Handlungen sind strikt untersagt:</p>
<ul>
  <li>Identitätsbetrug, d. h. Vortäuschung, eine andere Person oder Organisation zu sein</li>
  <li>Bereitstellung falscher, ungenauer oder irreführender Informationen</li>
  <li>Jegliches betrügerisches, missbräuchliches oder täuschendes Verhalten</li>
  <li>Versuche, unbefugten Zugang zu unseren Systemen oder Daten zu erlangen</li>
  <li>Beeinträchtigung oder Störung des Dienstbetriebs</li>
  <li>Nutzung des Dienstes zu Zwecken, die gegen geltendes Recht verstoßen</li>
</ul>
<p>Wir behalten uns das Recht vor, Nutzern, die gegen diese Regeln verstoßen, den Zugang zum Dienst ohne vorherige Ankündigung zu sperren oder zu kündigen.</p>

<h2>4. HAFTUNGSBESCHRÄNKUNG</h2>
<p>Der Dienst wird „wie besehen" und „nach Verfügbarkeit" ohne Gewährleistung jeglicher Art bereitgestellt, weder ausdrücklich noch stillschweigend, einschließlich, aber nicht beschränkt auf Gewährleistungen der Marktgängigkeit, Eignung für einen bestimmten Zweck oder Nichtverletzung von Rechten.</p>

<h3>4.1 Allgemeine Haftung</h3>
<p>Im größtmöglichen gesetzlich zulässigen Umfang haftet ADSKI nicht für direkte, indirekte, zufällige, besondere oder Folgeschäden, die aus Ihrer Nutzung oder Unfähigkeit zur Nutzung des Dienstes entstehen.</p>

<h3>4.2 Inhaltsverantwortung</h3>
<p>ADSKI übernimmt keine Gewähr für die Richtigkeit, Vollständigkeit oder Aktualität der auf dem Dienst veröffentlichten Informationen. Sie tragen die volle Verantwortung für Entscheidungen, die auf der Grundlage von über den Dienst erhaltenen Informationen getroffen werden.</p>

<h3>4.3 Externe Links</h3>
<p>Der Dienst kann Links zu Websites Dritter enthalten. ADSKI hat keine Kontrolle über und übernimmt keine Verantwortung für den Inhalt, die Datenschutzpraktiken oder die Verfügbarkeit dieser Websites.</p>

<h2>5. GEISTIGES EIGENTUM</h2>
<p>Alle Elemente des Dienstes, einschließlich, aber nicht beschränkt auf Texte, Grafiken, Logos, Symbole, Bilder, Audioclips und Software, sind ausschließliches Eigentum von ADSKI oder seinen Lizenzgebern und durch anwendbare Gesetze zum geistigen Eigentum geschützt.</p>
<p>Wir respektieren die geistigen Eigentumsrechte Dritter und erwarten dasselbe von unseren Nutzern.</p>
<p>Sie dürfen den Dienst ausschließlich für private, nicht-kommerzielle Zwecke nutzen. Die Vervielfältigung, Verbreitung, Änderung oder öffentliche Darstellung von Inhalten des Dienstes ohne unsere vorherige schriftliche Zustimmung ist untersagt.</p>

<h2>6. DATENSCHUTZ</h2>
<p>Wir erheben und verarbeiten bestimmte personenbezogene Daten im Zusammenhang mit Ihrer Nutzung des Dienstes. Einzelheiten zum Umgang mit Ihren Daten, einschließlich der Zwecke, Rechtsgrundlagen, Speicherfristen und Ihrer Rechte, sind in unserer <a href="privacy-policy">Datenschutzerklärung</a> dargelegt.</p>
<p>Wir implementieren geeignete technische und organisatorische Maßnahmen, um Ihre personenbezogenen Daten vor unbefugtem Zugriff, Offenlegung, Änderung oder Vernichtung zu schützen.</p>
`);
}

function ruTemplate(): string {
    return pageWrapper('ru', 'Пользовательское соглашение – Finmatcher', `
<h1>ПОЛЬЗОВАТЕЛЬСКОЕ СОГЛАШЕНИЕ</h1>
<p class="version">Версия 1, 30 мая 2026 г.</p>

<h2>1. ОБЩИЕ ПОЛОЖЕНИЯ</h2>
<p>Настоящее Пользовательское соглашение регулирует договорные отношения между вами (пользователем) и <strong>${COMPANY_NAME}</strong>, эстонской компанией с регистрационным номером ${COMPANY_REG}, юридический адрес: ${COMPANY_ADDRESS} (далее — «ADSKI» или «мы»).</p>
<p>Настоящие условия распространяются на использование веб-сайта и мобильного приложения Finmatcher (совместно именуемых «Сервис»). Получая доступ к Сервису или используя его, вы соглашаетесь с настоящими Условиями.</p>
<p>Мы оставляем за собой право изменять настоящие Условия в любое время. Продолжение использования Сервиса после уведомления об изменениях означает принятие обновлённых Условий.</p>
<p>Настоящие Условия регулируются применимым местным законодательством. При отсутствии применимых местных норм применяется законодательство Эстонии.</p>
<p>По любым вопросам обращайтесь к нам: <a href="mailto:${COMPANY_EMAIL}">${COMPANY_EMAIL}</a></p>

<h2>2. ОБЪЁМ УСЛУГ</h2>

<h3>2.1 Регистрация и использование учётной записи</h3>
<p>Вы можете создать личный аккаунт для доступа ко всем функциям Сервиса. Вы несёте ответственность за конфиденциальность своих учётных данных. Обратите внимание, что удаление аккаунта является необратимым и повлечёт безвозвратную утрату ваших данных.</p>

<h3>2.2 Сравнение кредитных продуктов</h3>
<p>Сервис позволяет сравнивать финансовые продукты различных поставщиков. Отображаемая информация носит исключительно информационный характер и не является обязывающим предложением.</p>

<h3>2.3 Информационные материалы</h3>
<p>Мы публикуем редакционные статьи по финансовым темам, рейтинги продуктов и руководства. Данный контент предназначен исключительно для общих информационных целей и не является финансовым советом.</p>

<h3>2.4 Каталог предварительных кредитных предложений</h3>
<p>Отображаемые условия кредита носят исключительно предварительный и ориентировочный характер. Фактические условия определяются исключительно соответствующим финансовым учреждением и могут отличаться от представленных.</p>

<h3>2.5 Предварительный запрос на получение кредита</h3>
<p>Сервис позволяет вам направить предварительный запрос на получение кредита в финансовые учреждения-партнёры. Делая это, вы соглашаетесь на передачу предоставленной вами информации соответствующим партнёрам для обработки вашего запроса.</p>

<p>Сервис предоставляется пользователям бесплатно. ADSKI не является финансовым учреждением, кредитным брокером или финансовым консультантом. Мы не предоставляем кредитные или финансовые услуги напрямую.</p>

<h2>3. ПРАВИЛА ИСПОЛЬЗОВАНИЯ СЕРВИСА</h2>
<p>Использование Сервиса ограничено лицами в возрасте 18 лет и старше.</p>
<p>Следующие действия строго запрещены:</p>
<ul>
  <li>Выдавать себя за другое лицо или организацию</li>
  <li>Предоставлять ложную, недостоверную или вводящую в заблуждение информацию</li>
  <li>Любые мошеннические, злоупотребительные или обманные действия</li>
  <li>Попытки получить несанкционированный доступ к нашим системам или данным</li>
  <li>Нарушение или препятствование работе Сервиса</li>
  <li>Использование Сервиса в целях, нарушающих применимое законодательство</li>
</ul>
<p>Мы оставляем за собой право приостановить или прекратить доступ к Сервису для любого пользователя, нарушившего данные правила, без предварительного уведомления.</p>

<h2>4. ОГРАНИЧЕНИЕ ОТВЕТСТВЕННОСТИ</h2>
<p>Сервис предоставляется «как есть» и «по мере доступности» без каких-либо гарантий, явных или подразумеваемых, включая, помимо прочего, гарантии товарной пригодности, пригодности для конкретной цели или ненарушения прав.</p>

<h3>4.1 Общая ответственность</h3>
<p>В максимальной степени, допускаемой применимым законодательством, ADSKI не несёт ответственности за прямые, косвенные, случайные, специальные или косвенные убытки, возникшие вследствие использования вами Сервиса или невозможности его использования.</p>

<h3>4.2 Ответственность за контент</h3>
<p>ADSKI не гарантирует точность, полноту или актуальность информации, опубликованной на Сервисе. Вы принимаете на себя полную ответственность за решения, принятые на основании информации, полученной через Сервис.</p>

<h3>4.3 Внешние ссылки</h3>
<p>Сервис может содержать ссылки на сторонние веб-сайты. ADSKI не контролирует и не несёт ответственности за контент, политику конфиденциальности или доступность таких сайтов.</p>

<h2>5. ПРАВА ИНТЕЛЛЕКТУАЛЬНОЙ СОБСТВЕННОСТИ</h2>
<p>Все элементы Сервиса, включая, помимо прочего, тексты, графику, логотипы, значки, изображения, аудиоклипы и программное обеспечение, являются исключительной собственностью ADSKI или её лицензиаров и защищены применимыми законами об интеллектуальной собственности.</p>
<p>Мы уважаем права интеллектуальной собственности третьих лиц и ожидаем того же от пользователей.</p>
<p>Вы можете использовать Сервис исключительно в частных некоммерческих целях. Воспроизведение, распространение, изменение или публичное отображение любого контента Сервиса без нашего предварительного письменного согласия запрещено.</p>

<h2>6. ЗАЩИТА ПЕРСОНАЛЬНЫХ ДАННЫХ</h2>
<p>Мы собираем и обрабатываем определённые персональные данные в связи с вашим использованием Сервиса. Подробности об обработке ваших данных, включая цели, правовые основания, сроки хранения и ваши права, изложены в нашей <a href="privacy-policy">Политике конфиденциальности</a>.</p>
<p>Мы применяем надлежащие технические и организационные меры для защиты ваших персональных данных от несанкционированного доступа, раскрытия, изменения или уничтожения.</p>
`);
}

function msTemplate(): string {
    return pageWrapper('ms', 'Terma dan Syarat – Finmatcher', `
<h1>TERMA DAN SYARAT</h1>
<p class="version">Versi 1, 30 Mei 2026</p>

<h2>1. PERUNTUKAN UMUM</h2>
<p>Terma dan Syarat ini mengawal hubungan kontrak antara anda (pengguna) dan <strong>${COMPANY_NAME}</strong>, sebuah syarikat Estonia dengan nombor pendaftaran ${COMPANY_REG}, alamat berdaftar: ${COMPANY_ADDRESS} (selepas ini "ADSKI" atau "kami").</p>
<p>Terma ini terpakai kepada penggunaan laman web dan aplikasi mudah alih Finmatcher (secara kolektif, "Perkhidmatan"). Dengan mengakses atau menggunakan Perkhidmatan, anda bersetuju untuk terikat dengan Terma ini.</p>
<p>Kami berhak untuk mengubah Terma ini pada bila-bila masa. Penggunaan berterusan Perkhidmatan selepas pemberitahuan perubahan merupakan penerimaan Terma yang dikemas kini.</p>
<p>Terma ini dikawal oleh undang-undang tempatan yang berkenaan. Sekiranya tiada peruntukan tempatan yang berkenaan, undang-undang Estonia akan terpakai.</p>
<p>Untuk sebarang pertanyaan, hubungi kami di: <a href="mailto:${COMPANY_EMAIL}">${COMPANY_EMAIL}</a></p>

<h2>2. SKOP PERKHIDMATAN</h2>

<h3>2.1 Pendaftaran dan Penggunaan Akaun</h3>
<p>Anda boleh membuat akaun peribadi untuk mengakses semua ciri Perkhidmatan. Anda bertanggungjawab untuk mengekalkan kerahsiaan kelayakan log masuk anda. Sila ambil perhatian bahawa pemadaman akaun adalah tidak boleh diterbalikkan dan akan mengakibatkan kehilangan data anda secara kekal.</p>

<h3>2.2 Perbandingan Produk Kredit</h3>
<p>Perkhidmatan membolehkan anda membandingkan produk kewangan daripada pelbagai pembekal. Maklumat yang dipaparkan adalah untuk tujuan maklumat sahaja dan tidak merupakan tawaran yang mengikat.</p>

<h3>2.3 Kandungan Maklumat</h3>
<p>Kami menerbitkan artikel editorial mengenai topik kewangan, penarafan produk dan panduan. Kandungan ini adalah untuk tujuan maklumat umum sahaja dan tidak merupakan nasihat kewangan.</p>

<h3>2.4 Katalog Tawaran Kredit Awal</h3>
<p>Syarat kredit yang dipaparkan adalah awal dan petunjuk sahaja. Syarat sebenar ditentukan secara eksklusif oleh institusi kewangan yang berkenaan dan mungkin berbeza daripada yang ditunjukkan.</p>

<h3>2.5 Permohonan Pinjaman Awal</h3>
<p>Perkhidmatan membolehkan anda mengemukakan permohonan pinjaman awal kepada institusi kewangan rakan kongsi kami. Dengan berbuat demikian, anda bersetuju dengan perkongsian maklumat yang anda berikan dengan rakan kongsi yang berkenaan bagi tujuan memproses permohonan anda.</p>

<p>Perkhidmatan disediakan secara percuma kepada pengguna. ADSKI bukan institusi kewangan, broker kredit atau penasihat kewangan. Kami tidak menyediakan perkhidmatan kredit atau kewangan secara langsung.</p>

<h2>3. PERATURAN PENGGUNAAN PERKHIDMATAN</h2>
<p>Penggunaan Perkhidmatan adalah terhad kepada orang yang berumur 18 tahun ke atas.</p>
<p>Tindakan berikut adalah dilarang sama sekali:</p>
<ul>
  <li>Menyamar sebagai orang atau organisasi lain</li>
  <li>Memberikan maklumat yang palsu, tidak tepat atau mengelirukan</li>
  <li>Sebarang tingkah laku penipuan, penyalahgunaan atau menipu</li>
  <li>Mencuba mendapatkan akses tanpa kebenaran ke sistem atau data kami</li>
  <li>Mengganggu atau mengganggu operasi Perkhidmatan</li>
  <li>Menggunakan Perkhidmatan untuk sebarang tujuan yang melanggar undang-undang yang berkenaan</li>
</ul>
<p>Kami berhak untuk menggantung atau menamatkan akses kepada Perkhidmatan bagi mana-mana pengguna yang melanggar peraturan ini, tanpa notis terlebih dahulu.</p>

<h2>4. HAD LIABILITI</h2>
<p>Perkhidmatan disediakan atas dasar "sebagaimana adanya" dan "sebagaimana tersedia" tanpa sebarang waranti, sama ada tersurat atau tersirat, termasuk tetapi tidak terhad kepada waranti kebolehdagangan, kesesuaian untuk tujuan tertentu atau tidak pelanggaran hak.</p>

<h3>4.1 Liabiliti Umum</h3>
<p>Setakat yang dibenarkan oleh undang-undang yang berkenaan, ADSKI tidak bertanggungjawab atas sebarang ganti rugi langsung, tidak langsung, sampingan, khas atau turutan yang timbul daripada penggunaan anda atau ketidakupayaan untuk menggunakan Perkhidmatan.</p>

<h3>4.2 Tanggungjawab Kandungan</h3>
<p>ADSKI tidak menjamin ketepatan, kelengkapan atau ketepatan masa sebarang maklumat yang diterbitkan di Perkhidmatan. Anda menanggung tanggungjawab penuh atas sebarang keputusan yang dibuat berdasarkan maklumat yang diperoleh melalui Perkhidmatan.</p>

<h3>4.3 Pautan Luaran</h3>
<p>Perkhidmatan mungkin mengandungi pautan ke laman web pihak ketiga. ADSKI tidak mempunyai kawalan ke atas, dan tidak menerima sebarang tanggungjawab untuk, kandungan, amalan privasi atau ketersediaan laman web tersebut.</p>

<h2>5. HAK HARTA INTELEK</h2>
<p>Semua elemen Perkhidmatan, termasuk tetapi tidak terhad kepada teks, grafik, logo, ikon, imej, klip audio dan perisian, adalah hak milik eksklusif ADSKI atau pelesennya dan dilindungi oleh undang-undang harta intelek yang berkenaan.</p>
<p>Kami menghormati hak harta intelek pihak ketiga dan mengharapkan pengguna melakukan perkara yang sama.</p>
<p>Anda hanya boleh menggunakan Perkhidmatan untuk tujuan peribadi dan bukan komersial. Pembiakan semula, pengedaran, pengubahsuaian atau paparan awam sebarang kandungan Perkhidmatan tanpa persetujuan bertulis kami terlebih dahulu adalah dilarang.</p>

<h2>6. PERLINDUNGAN DATA PERIBADI</h2>
<p>Kami mengumpul dan memproses data peribadi tertentu berkaitan dengan penggunaan Perkhidmatan oleh anda. Butiran tentang cara kami mengendalikan data anda, termasuk tujuan, asas undang-undang, tempoh pengekalan dan hak anda, dinyatakan dalam <a href="privacy-policy">Dasar Privasi</a> kami.</p>
<p>Kami melaksanakan langkah teknikal dan organisasi yang sesuai untuk melindungi data peribadi anda daripada akses, pendedahan, pengubahan atau pemusnahan yang tidak dibenarkan.</p>
`);
}

function roTemplate(): string {
    return pageWrapper('ro', 'Termeni și Condiții – Finmatcher', `
<h1>TERMENI ȘI CONDIȚII</h1>
<p class="version">Versiunea 1, 30 mai 2026</p>

<h2>1. DISPOZIȚII GENERALE</h2>
<p>Prezentele Termeni și Condiții reglementează relația contractuală dintre dumneavoastră (utilizatorul) și <strong>${COMPANY_NAME}</strong>, o societate estoniană cu numărul de înregistrare ${COMPANY_REG}, adresă înregistrată: ${COMPANY_ADDRESS} (denumită în continuare „ADSKI" sau „noi").</p>
<p>Acești termeni se aplică utilizării site-ului web și aplicației mobile Finmatcher (denumite colectiv „Serviciul"). Prin accesarea sau utilizarea Serviciului, sunteți de acord cu acești Termeni.</p>
<p>Ne rezervăm dreptul de a modifica acești Termeni în orice moment. Utilizarea continuă a Serviciului după notificarea modificărilor constituie acceptul Termenilor actualizați.</p>
<p>Acești Termeni sunt guvernați de legile locale aplicabile. În absența unor dispoziții locale aplicabile, se aplică legislația estoniană.</p>
<p>Pentru orice întrebări, contactați-ne la: <a href="mailto:${COMPANY_EMAIL}">${COMPANY_EMAIL}</a></p>

<h2>2. SFERA SERVICIILOR</h2>

<h3>2.1 Înregistrarea și utilizarea contului</h3>
<p>Puteți crea un cont personal pentru a accesa toate funcționalitățile Serviciului. Sunteți responsabil pentru păstrarea confidențialității datelor de autentificare. Vă rugăm să rețineți că ștergerea contului este ireversibilă și va duce la pierderea permanentă a datelor dumneavoastră.</p>

<h3>2.2 Compararea produselor de credit</h3>
<p>Serviciul vă permite să comparați produse financiare de la diverși furnizori. Informațiile afișate au exclusiv scop informativ și nu constituie o ofertă cu caracter obligatoriu.</p>

<h3>2.3 Conținut informativ</h3>
<p>Publicăm articole editoriale despre subiecte financiare, clasamente de produse și ghiduri. Acest conținut are exclusiv scop informativ general și nu constituie consultanță financiară.</p>

<h3>2.4 Catalogul de oferte de credit preliminare</h3>
<p>Condițiile de credit afișate sunt exclusiv preliminare și orientative. Condițiile reale sunt determinate exclusiv de instituția financiară respectivă și pot diferi de cele afișate.</p>

<h3>2.5 Cererea preliminară de împrumut</h3>
<p>Serviciul vă permite să transmiteți o cerere preliminară de împrumut instituțiilor financiare partenere. Procedând astfel, vă exprimați consimțământul pentru partajarea informațiilor furnizate cu partenerii relevanți în scopul procesării cererii dumneavoastră.</p>

<p>Serviciul este gratuit pentru utilizatori. ADSKI nu este o instituție financiară, broker de credit sau consilier financiar. Nu oferim servicii de credit sau financiare în mod direct.</p>

<h2>3. REGULI DE UTILIZARE A SERVICIULUI</h2>
<p>Utilizarea Serviciului este restricționată la persoanele cu vârsta de 18 ani și peste.</p>
<p>Următoarele acțiuni sunt strict interzise:</p>
<ul>
  <li>Uzurparea identității altei persoane sau organizații</li>
  <li>Furnizarea de informații false, inexacte sau înșelătoare</li>
  <li>Orice conduită frauduloasă, abuzivă sau înșelătoare</li>
  <li>Tentative de acces neautorizat la sistemele sau datele noastre</li>
  <li>Interferența cu sau perturbarea funcționării Serviciului</li>
  <li>Utilizarea Serviciului în orice scop care încalcă legea aplicabilă</li>
</ul>
<p>Ne rezervăm dreptul de a suspenda sau rezilia accesul la Serviciu pentru orice utilizator care încalcă aceste reguli, fără notificare prealabilă.</p>

<h2>4. LIMITAREA RĂSPUNDERII</h2>
<p>Serviciul este furnizat „ca atare" și „conform disponibilității", fără garanții de niciun fel, explicite sau implicite, inclusiv, dar fără a se limita la garanțiile de comercializabilitate, adecvare pentru un scop particular sau neîncălcare a drepturilor.</p>

<h3>4.1 Răspundere generală</h3>
<p>În măsura maximă permisă de legea aplicabilă, ADSKI nu va fi răspunzătoare pentru niciun fel de daune directe, indirecte, incidentale, speciale sau consecutive care decurg din utilizarea sau incapacitatea de a utiliza Serviciul.</p>

<h3>4.2 Responsabilitatea pentru conținut</h3>
<p>ADSKI nu garantează acuratețea, caracterul complet sau actualitatea informațiilor publicate pe Serviciu. Vă asumați întreaga responsabilitate pentru deciziile luate pe baza informațiilor obținute prin intermediul Serviciului.</p>

<h3>4.3 Linkuri externe</h3>
<p>Serviciul poate conține linkuri către site-uri web ale terților. ADSKI nu deține controlul și nu acceptă responsabilitatea pentru conținutul, practicile de confidențialitate sau disponibilitatea acelor site-uri web.</p>

<h2>5. DREPTURI DE PROPRIETATE INTELECTUALĂ</h2>
<p>Toate elementele Serviciului, inclusiv, dar fără a se limita la texte, grafice, logo-uri, pictograme, imagini, clipuri audio și software, sunt proprietatea exclusivă a ADSKI sau a licențiatorilor săi și sunt protejate de legile aplicabile privind proprietatea intelectuală.</p>
<p>Respectăm drepturile de proprietate intelectuală ale terților și ne așteptăm ca utilizatorii să facă același lucru.</p>
<p>Puteți utiliza Serviciul exclusiv în scopuri private, necomerciale. Reproducerea, distribuirea, modificarea sau afișarea publică a oricărui conținut al Serviciului fără consimțământul nostru scris prealabil este interzisă.</p>

<h2>6. PROTECȚIA DATELOR CU CARACTER PERSONAL</h2>
<p>Colectăm și prelucrăm anumite date cu caracter personal în legătură cu utilizarea Serviciului de către dumneavoastră. Detaliile privind modul în care gestionăm datele dumneavoastră, inclusiv scopurile, temeiurile legale, perioadele de stocare și drepturile dumneavoastră, sunt prezentate în <a href="privacy-policy">Politica noastră de Confidențialitate</a>.</p>
<p>Implementăm măsuri tehnice și organizatorice adecvate pentru a proteja datele dumneavoastră cu caracter personal împotriva accesului, divulgării, modificării sau distrugerii neautorizate.</p>
`);
}

function ukTemplate(): string {
    return pageWrapper('uk', 'Умови використання – Finmatcher', `
<h1>УМОВИ ВИКОРИСТАННЯ</h1>
<p class="version">Версія 1, 30 травня 2026 р.</p>

<h2>1. ЗАГАЛЬНІ ПОЛОЖЕННЯ</h2>
<p>Ці Умови використання регулюють договірні відносини між вами (користувачем) та <strong>${COMPANY_NAME}</strong>, естонською компанією з реєстраційним номером ${COMPANY_REG}, юридична адреса: ${COMPANY_ADDRESS} (далі — «ADSKI» або «ми»).</p>
<p>Ці умови поширюються на використання веб-сайту та мобільного додатку Finmatcher (разом — «Сервіс»). Отримуючи доступ до Сервісу або використовуючи його, ви погоджуєтеся з цими Умовами.</p>
<p>Ми залишаємо за собою право змінювати ці Умови в будь-який час. Продовження використання Сервісу після повідомлення про зміни означає прийняття оновлених Умов.</p>
<p>Ці Умови регулюються чинним місцевим законодавством. За відсутності застосовних місцевих норм застосовується законодавство Естонії.</p>
<p>З будь-яких питань звертайтеся до нас: <a href="mailto:${COMPANY_EMAIL}">${COMPANY_EMAIL}</a></p>

<h2>2. ОБСЯГ ПОСЛУГ</h2>

<h3>2.1 Реєстрація та використання облікового запису</h3>
<p>Ви можете створити особистий обліковий запис для доступу до всіх функцій Сервісу. Ви несете відповідальність за збереження конфіденційності своїх облікових даних. Зверніть увагу, що видалення облікового запису є незворотним і призведе до безповоротної втрати ваших даних.</p>

<h3>2.2 Порівняння кредитних продуктів</h3>
<p>Сервіс дозволяє порівнювати фінансові продукти різних постачальників. Відображувана інформація має виключно інформаційний характер і не є обов'язковою пропозицією.</p>

<h3>2.3 Інформаційні матеріали</h3>
<p>Ми публікуємо редакційні статті з фінансових тем, рейтинги продуктів і посібники. Цей контент призначений виключно для загальних інформаційних цілей і не є фінансовою порадою.</p>

<h3>2.4 Каталог попередніх кредитних пропозицій</h3>
<p>Умови кредиту, що відображаються, мають виключно попередній та орієнтовний характер. Фактичні умови визначаються виключно відповідною фінансовою установою і можуть відрізнятися від представлених.</p>

<h3>2.5 Попередній запит на отримання кредиту</h3>
<p>Сервіс дозволяє вам подати попередній запит на отримання кредиту до фінансових установ-партнерів. Роблячи це, ви погоджуєтеся на передачу наданої вами інформації відповідним партнерам для обробки вашого запиту.</p>

<p>Сервіс надається користувачам безкоштовно. ADSKI не є фінансовою установою, кредитним брокером або фінансовим консультантом. Ми не надаємо кредитні або фінансові послуги безпосередньо.</p>

<h2>3. ПРАВИЛА ВИКОРИСТАННЯ СЕРВІСУ</h2>
<p>Використання Сервісу обмежено особами у віці 18 років і старше.</p>
<p>Такі дії суворо заборонені:</p>
<ul>
  <li>Видавати себе за іншу особу або організацію</li>
  <li>Надавати неправдиву, недостовірну або оманливу інформацію</li>
  <li>Будь-які шахрайські, зловживаючі або обманливі дії</li>
  <li>Спроби отримати несанкціонований доступ до наших систем або даних</li>
  <li>Втручання у роботу Сервісу або її порушення</li>
  <li>Використання Сервісу для будь-яких цілей, що порушують чинне законодавство</li>
</ul>
<p>Ми залишаємо за собою право призупинити або припинити доступ до Сервісу для будь-якого користувача, який порушує ці правила, без попереднього повідомлення.</p>

<h2>4. ОБМЕЖЕННЯ ВІДПОВІДАЛЬНОСТІ</h2>
<p>Сервіс надається «як є» та «в міру доступності» без будь-яких гарантій, явних або мається на увазі, включаючи, але не обмежуючись гарантіями придатності для продажу, придатності для певної мети або ненарушення прав.</p>

<h3>4.1 Загальна відповідальність</h3>
<p>У максимальній мірі, дозволеній чинним законодавством, ADSKI не несе відповідальності за будь-які прямі, непрямі, випадкові, спеціальні або непрямі збитки, що виникли внаслідок використання вами Сервісу або неможливості його використання.</p>

<h3>4.2 Відповідальність за контент</h3>
<p>ADSKI не гарантує точність, повноту або актуальність інформації, опублікованої на Сервісі. Ви приймаєте на себе повну відповідальність за рішення, прийняті на основі інформації, отриманої через Сервіс.</p>

<h3>4.3 Зовнішні посилання</h3>
<p>Сервіс може містити посилання на веб-сайти третіх осіб. ADSKI не контролює і не несе відповідальності за контент, політику конфіденційності або доступність таких сайтів.</p>

<h2>5. ПРАВА ІНТЕЛЕКТУАЛЬНОЇ ВЛАСНОСТІ</h2>
<p>Всі елементи Сервісу, включаючи, але не обмежуючись текстами, графікою, логотипами, значками, зображеннями, аудіокліпами та програмним забезпеченням, є виключною власністю ADSKI або її ліцензіарів і захищені чинним законодавством про інтелектуальну власність.</p>
<p>Ми поважаємо права інтелектуальної власності третіх осіб і очікуємо того ж від користувачів.</p>
<p>Ви можете використовувати Сервіс виключно в приватних некомерційних цілях. Відтворення, розповсюдження, зміна або публічне відображення будь-якого контенту Сервісу без нашої попередньої письмової згоди заборонено.</p>

<h2>6. ЗАХИСТ ПЕРСОНАЛЬНИХ ДАНИХ</h2>
<p>Ми збираємо та обробляємо певні персональні дані у зв'язку з вашим використанням Сервісу. Детальна інформація про те, як ми обробляємо ваші дані, включаючи цілі, правові підстави, строки зберігання та ваші права, викладена в нашій <a href="privacy-policy">Політиці конфіденційності</a>.</p>
<p>Ми впроваджуємо відповідні технічні та організаційні заходи для захисту ваших персональних даних від несанкціонованого доступу, розкриття, зміни або знищення.</p>
`);
}

function viTemplate(): string {
    return pageWrapper('vi', 'Điều khoản và Điều kiện – Finmatcher', `
<h1>ĐIỀU KHOẢN VÀ ĐIỀU KIỆN</h1>
<p class="version">Phiên bản 1, ngày 30 tháng 5 năm 2026</p>

<h2>1. QUY ĐỊNH CHUNG</h2>
<p>Điều khoản và Điều kiện này điều chỉnh mối quan hệ hợp đồng giữa bạn (người dùng) và <strong>${COMPANY_NAME}</strong>, một công ty Estonia với số đăng ký ${COMPANY_REG}, địa chỉ đăng ký: ${COMPANY_ADDRESS} (sau đây gọi là "ADSKI" hoặc "chúng tôi").</p>
<p>Các điều khoản này áp dụng cho việc sử dụng trang web và ứng dụng di động Finmatcher (gọi chung là "Dịch vụ"). Bằng cách truy cập hoặc sử dụng Dịch vụ, bạn đồng ý bị ràng buộc bởi các Điều khoản này.</p>
<p>Chúng tôi bảo lưu quyền sửa đổi các Điều khoản này bất cứ lúc nào. Việc tiếp tục sử dụng Dịch vụ sau khi thông báo thay đổi được coi là chấp nhận các Điều khoản cập nhật.</p>
<p>Các Điều khoản này được điều chỉnh bởi pháp luật địa phương hiện hành. Trong trường hợp không có quy định địa phương áp dụng, pháp luật Estonia sẽ được áp dụng.</p>
<p>Mọi thắc mắc, vui lòng liên hệ với chúng tôi tại: <a href="mailto:${COMPANY_EMAIL}">${COMPANY_EMAIL}</a></p>

<h2>2. PHẠM VI DỊCH VỤ</h2>

<h3>2.1 Đăng ký và sử dụng tài khoản</h3>
<p>Bạn có thể tạo tài khoản cá nhân để truy cập đầy đủ các tính năng của Dịch vụ. Bạn có trách nhiệm bảo mật thông tin đăng nhập của mình. Lưu ý rằng việc xóa tài khoản là không thể hoàn tác và sẽ dẫn đến mất dữ liệu vĩnh viễn.</p>

<h3>2.2 So sánh sản phẩm tín dụng</h3>
<p>Dịch vụ cho phép bạn so sánh các sản phẩm tài chính từ nhiều nhà cung cấp khác nhau. Thông tin hiển thị chỉ mang tính chất cung cấp thông tin và không cấu thành một đề nghị ràng buộc.</p>

<h3>2.3 Nội dung thông tin</h3>
<p>Chúng tôi đăng tải các bài viết biên tập về chủ đề tài chính, bảng xếp hạng sản phẩm và hướng dẫn. Nội dung này chỉ nhằm mục đích cung cấp thông tin chung và không cấu thành lời tư vấn tài chính.</p>

<h3>2.4 Danh mục ưu đãi tín dụng sơ bộ</h3>
<p>Các điều kiện tín dụng hiển thị chỉ mang tính sơ bộ và tham khảo. Các điều khoản thực tế được xác định duy nhất bởi tổ chức tài chính tương ứng và có thể khác với những gì được hiển thị.</p>

<h3>2.5 Yêu cầu vay sơ bộ</h3>
<p>Dịch vụ cho phép bạn gửi yêu cầu vay sơ bộ đến các tổ chức tài chính đối tác của chúng tôi. Khi làm vậy, bạn đồng ý chia sẻ thông tin bạn cung cấp với các đối tác liên quan để xử lý yêu cầu của bạn.</p>

<p>Dịch vụ được cung cấp miễn phí cho người dùng. ADSKI không phải là tổ chức tài chính, nhà môi giới tín dụng hay cố vấn tài chính. Chúng tôi không cung cấp dịch vụ tín dụng hoặc tài chính trực tiếp.</p>

<h2>3. QUY TẮC SỬ DỤNG DỊCH VỤ</h2>
<p>Việc sử dụng Dịch vụ chỉ dành cho người từ 18 tuổi trở lên.</p>
<p>Các hành động sau đây bị nghiêm cấm:</p>
<ul>
  <li>Mạo danh người khác hoặc tổ chức khác</li>
  <li>Cung cấp thông tin sai, không chính xác hoặc gây hiểu nhầm</li>
  <li>Bất kỳ hành vi gian lận, lạm dụng hoặc lừa dối nào</li>
  <li>Cố gắng truy cập trái phép vào hệ thống hoặc dữ liệu của chúng tôi</li>
  <li>Can thiệp hoặc làm gián đoạn hoạt động của Dịch vụ</li>
  <li>Sử dụng Dịch vụ cho bất kỳ mục đích nào vi phạm pháp luật hiện hành</li>
</ul>
<p>Chúng tôi bảo lưu quyền đình chỉ hoặc chấm dứt quyền truy cập vào Dịch vụ đối với bất kỳ người dùng nào vi phạm các quy tắc này, mà không cần thông báo trước.</p>

<h2>4. GIỚI HẠN TRÁCH NHIỆM</h2>
<p>Dịch vụ được cung cấp trên cơ sở "như hiện tại" và "tùy theo khả năng" mà không có bất kỳ bảo đảm nào, dù rõ ràng hay ngụ ý, bao gồm nhưng không giới hạn ở các bảo đảm về tính thương mại, tính phù hợp cho một mục đích cụ thể hoặc không vi phạm quyền.</p>

<h3>4.1 Trách nhiệm chung</h3>
<p>Trong phạm vi tối đa được pháp luật hiện hành cho phép, ADSKI sẽ không chịu trách nhiệm về bất kỳ thiệt hại trực tiếp, gián tiếp, ngẫu nhiên, đặc biệt hoặc hậu quả nào phát sinh từ việc bạn sử dụng hoặc không thể sử dụng Dịch vụ.</p>

<h3>4.2 Trách nhiệm về nội dung</h3>
<p>ADSKI không đảm bảo tính chính xác, đầy đủ hay kịp thời của bất kỳ thông tin nào được đăng tải trên Dịch vụ. Bạn chịu hoàn toàn trách nhiệm về mọi quyết định được đưa ra dựa trên thông tin thu được qua Dịch vụ.</p>

<h3>4.3 Liên kết bên ngoài</h3>
<p>Dịch vụ có thể chứa các liên kết đến các trang web của bên thứ ba. ADSKI không kiểm soát và không chấp nhận bất kỳ trách nhiệm nào về nội dung, các thực hành bảo mật hoặc tính khả dụng của những trang web đó.</p>

<h2>5. QUYỀN SỞ HỮU TRÍ TUỆ</h2>
<p>Tất cả các yếu tố của Dịch vụ, bao gồm nhưng không giới hạn ở văn bản, đồ họa, logo, biểu tượng, hình ảnh, đoạn âm thanh và phần mềm, là tài sản độc quyền của ADSKI hoặc những người cấp phép và được bảo vệ bởi luật sở hữu trí tuệ hiện hành.</p>
<p>Chúng tôi tôn trọng quyền sở hữu trí tuệ của bên thứ ba và mong đợi người dùng làm điều tương tự.</p>
<p>Bạn chỉ có thể sử dụng Dịch vụ cho mục đích cá nhân, phi thương mại. Nghiêm cấm sao chép, phân phối, sửa đổi hoặc trình chiếu công khai bất kỳ nội dung nào của Dịch vụ mà không có sự đồng ý bằng văn bản trước của chúng tôi.</p>

<h2>6. BẢO VỆ DỮ LIỆU CÁ NHÂN</h2>
<p>Chúng tôi thu thập và xử lý một số dữ liệu cá nhân liên quan đến việc bạn sử dụng Dịch vụ. Chi tiết về cách chúng tôi xử lý dữ liệu của bạn, bao gồm mục đích, căn cứ pháp lý, thời hạn lưu giữ và quyền của bạn, được nêu trong <a href="privacy-policy">Chính sách Bảo mật</a> của chúng tôi.</p>
<p>Chúng tôi thực hiện các biện pháp kỹ thuật và tổ chức phù hợp để bảo vệ dữ liệu cá nhân của bạn khỏi truy cập, tiết lộ, thay đổi hoặc phá hủy trái phép.</p>
`);
}

const templateFns: Record<TermsTemplate, () => string> = {
    en: enTemplate,
    es: esTemplate,
    de: deTemplate,
    ru: ruTemplate,
    ms: msTemplate,
    ro: roTemplate,
    uk: ukTemplate,
    vi: viTemplate,
};

export function getTermsAndConditions() {
    return (req: Request, res: Response) => {
        const code = (req.params.code ?? '').toLowerCase();
        const template = countryTermsTemplates[code];
        if (!template) {
            res.status(404).type('text/plain').send('Terms and conditions not available for this region.');
            return;
        }
        const html = templateFns[template]();
        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        res.send(html);
    };
}
