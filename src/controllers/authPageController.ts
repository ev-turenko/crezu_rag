import { Request, Response } from 'express';
import { EXTERNAL_AUTH_COUNTRIES, COUNTRY_LANG_MAP } from '../enums/enums.js';

// ─── Translations ─────────────────────────────────────────────────────────────

type Lang = 'en' | 'es' | 'de' | 'ru' | 'uk' | 'ro' | 'vi' | 'ms';

interface AuthStrings {
    subtitle: string;
    tab_login: string;
    tab_register: string;
    field_email: string;
    field_password: string;
    field_confirm_password: string;
    field_name: string;
    field_recovery_code: string;
    field_new_password: string;
    field_confirm_new_password: string;
    btn_login: string;
    btn_register: string;
    btn_reset: string;
    btn_download: string;
    btn_continue: string;
    btn_back: string;
    link_forgot: string;
    link_no_account: string;
    link_have_account: string;
    reset_title: string;
    codes_title: string;
    codes_subtitle: string;
    codes_warning: string;
    success_registered: string;
    success_reset: string;
    err_email_required: string;
    err_password_required: string;
    err_passwords_mismatch: string;
    err_min_password: string;
    err_name_required: string;
    err_code_required: string;
    loading: string;
    page_title: string;
}

const TRANSLATIONS: Record<Lang, AuthStrings> = {
    en: {
        page_title: 'Finmatcher — Sign In',
        subtitle: 'AI Financial Assistant',
        tab_login: 'Sign In',
        tab_register: 'Register',
        field_email: 'Email',
        field_password: 'Password',
        field_confirm_password: 'Confirm Password',
        field_name: 'Full Name',
        field_recovery_code: 'Recovery Code',
        field_new_password: 'New Password',
        field_confirm_new_password: 'Confirm New Password',
        btn_login: 'Sign In',
        btn_register: 'Create Account',
        btn_reset: 'Reset Password',
        btn_download: 'Download Recovery Codes',
        btn_continue: 'Continue',
        btn_back: 'Back to Login',
        link_forgot: 'Forgot password?',
        link_no_account: "Don't have an account? Register",
        link_have_account: 'Already have an account? Sign In',
        reset_title: 'Reset Password',
        codes_title: 'Your Recovery Codes',
        codes_subtitle: 'Store these 10 codes in a safe place. Each code can only be used once to reset your password.',
        codes_warning: 'These codes will not be shown again. Download them now.',
        success_registered: 'Account created successfully!',
        success_reset: 'Password reset successfully! Save your new recovery codes below.',
        err_email_required: 'Email is required.',
        err_password_required: 'Password is required.',
        err_passwords_mismatch: 'Passwords do not match.',
        err_min_password: 'Password must be at least 8 characters.',
        err_name_required: 'Name is required.',
        err_code_required: 'Recovery code is required.',
        loading: 'Please wait…',
    },
    es: {
        page_title: 'Finmatcher — Iniciar sesión',
        subtitle: 'Asistente Financiero con IA',
        tab_login: 'Iniciar sesión',
        tab_register: 'Registrarse',
        field_email: 'Correo electrónico',
        field_password: 'Contraseña',
        field_confirm_password: 'Confirmar contraseña',
        field_name: 'Nombre completo',
        field_recovery_code: 'Código de recuperación',
        field_new_password: 'Nueva contraseña',
        field_confirm_new_password: 'Confirmar nueva contraseña',
        btn_login: 'Iniciar sesión',
        btn_register: 'Crear cuenta',
        btn_reset: 'Restablecer contraseña',
        btn_download: 'Descargar códigos de recuperación',
        btn_continue: 'Continuar',
        btn_back: 'Volver al inicio de sesión',
        link_forgot: '¿Olvidó su contraseña?',
        link_no_account: '¿No tiene cuenta? Regístrese',
        link_have_account: '¿Ya tiene cuenta? Iniciar sesión',
        reset_title: 'Restablecer contraseña',
        codes_title: 'Sus códigos de recuperación',
        codes_subtitle: 'Guarde estos 10 códigos en un lugar seguro. Cada código solo puede usarse una vez para restablecer su contraseña.',
        codes_warning: 'Estos códigos no se mostrarán de nuevo. Descárguelos ahora.',
        success_registered: '¡Cuenta creada con éxito!',
        success_reset: '¡Contraseña restablecida con éxito! Guarde sus nuevos códigos de recuperación.',
        err_email_required: 'El correo electrónico es obligatorio.',
        err_password_required: 'La contraseña es obligatoria.',
        err_passwords_mismatch: 'Las contraseñas no coinciden.',
        err_min_password: 'La contraseña debe tener al menos 8 caracteres.',
        err_name_required: 'El nombre es obligatorio.',
        err_code_required: 'El código de recuperación es obligatorio.',
        loading: 'Por favor espere…',
    },
    de: {
        page_title: 'Finmatcher — Anmelden',
        subtitle: 'KI-Finanzassistent',
        tab_login: 'Anmelden',
        tab_register: 'Registrieren',
        field_email: 'E-Mail',
        field_password: 'Passwort',
        field_confirm_password: 'Passwort bestätigen',
        field_name: 'Vollständiger Name',
        field_recovery_code: 'Wiederherstellungscode',
        field_new_password: 'Neues Passwort',
        field_confirm_new_password: 'Neues Passwort bestätigen',
        btn_login: 'Anmelden',
        btn_register: 'Konto erstellen',
        btn_reset: 'Passwort zurücksetzen',
        btn_download: 'Wiederherstellungscodes herunterladen',
        btn_continue: 'Weiter',
        btn_back: 'Zurück zur Anmeldung',
        link_forgot: 'Passwort vergessen?',
        link_no_account: 'Noch kein Konto? Registrieren',
        link_have_account: 'Bereits ein Konto? Anmelden',
        reset_title: 'Passwort zurücksetzen',
        codes_title: 'Ihre Wiederherstellungscodes',
        codes_subtitle: 'Bewahren Sie diese 10 Codes an einem sicheren Ort auf. Jeder Code kann nur einmal zum Zurücksetzen des Passworts verwendet werden.',
        codes_warning: 'Diese Codes werden nicht erneut angezeigt. Laden Sie sie jetzt herunter.',
        success_registered: 'Konto erfolgreich erstellt!',
        success_reset: 'Passwort erfolgreich zurückgesetzt! Speichern Sie Ihre neuen Wiederherstellungscodes.',
        err_email_required: 'E-Mail ist erforderlich.',
        err_password_required: 'Passwort ist erforderlich.',
        err_passwords_mismatch: 'Passwörter stimmen nicht überein.',
        err_min_password: 'Das Passwort muss mindestens 8 Zeichen lang sein.',
        err_name_required: 'Name ist erforderlich.',
        err_code_required: 'Wiederherstellungscode ist erforderlich.',
        loading: 'Bitte warten…',
    },
    ru: {
        page_title: 'Finmatcher — Вход',
        subtitle: 'ИИ-финансовый помощник',
        tab_login: 'Войти',
        tab_register: 'Регистрация',
        field_email: 'Email',
        field_password: 'Пароль',
        field_confirm_password: 'Подтвердите пароль',
        field_name: 'Полное имя',
        field_recovery_code: 'Код восстановления',
        field_new_password: 'Новый пароль',
        field_confirm_new_password: 'Подтвердите новый пароль',
        btn_login: 'Войти',
        btn_register: 'Создать аккаунт',
        btn_reset: 'Сбросить пароль',
        btn_download: 'Скачать коды восстановления',
        btn_continue: 'Продолжить',
        btn_back: 'Назад к входу',
        link_forgot: 'Забыли пароль?',
        link_no_account: 'Нет аккаунта? Зарегистрируйтесь',
        link_have_account: 'Уже есть аккаунт? Войти',
        reset_title: 'Сброс пароля',
        codes_title: 'Ваши коды восстановления',
        codes_subtitle: 'Сохраните эти 10 кодов в надёжном месте. Каждый код можно использовать только один раз для сброса пароля.',
        codes_warning: 'Эти коды больше не будут показаны. Скачайте их сейчас.',
        success_registered: 'Аккаунт успешно создан!',
        success_reset: 'Пароль успешно сброшен! Сохраните новые коды восстановления.',
        err_email_required: 'Email обязателен.',
        err_password_required: 'Пароль обязателен.',
        err_passwords_mismatch: 'Пароли не совпадают.',
        err_min_password: 'Пароль должен содержать не менее 8 символов.',
        err_name_required: 'Имя обязательно.',
        err_code_required: 'Код восстановления обязателен.',
        loading: 'Пожалуйста, подождите…',
    },
    uk: {
        page_title: 'Finmatcher — Вхід',
        subtitle: 'ШІ-фінансовий помічник',
        tab_login: 'Увійти',
        tab_register: 'Реєстрація',
        field_email: 'Email',
        field_password: 'Пароль',
        field_confirm_password: 'Підтвердіть пароль',
        field_name: 'Повне ім\'я',
        field_recovery_code: 'Код відновлення',
        field_new_password: 'Новий пароль',
        field_confirm_new_password: 'Підтвердіть новий пароль',
        btn_login: 'Увійти',
        btn_register: 'Створити акаунт',
        btn_reset: 'Скинути пароль',
        btn_download: 'Завантажити коди відновлення',
        btn_continue: 'Продовжити',
        btn_back: 'Назад до входу',
        link_forgot: 'Забули пароль?',
        link_no_account: 'Немає акаунту? Зареєструйтесь',
        link_have_account: 'Вже є акаунт? Увійти',
        reset_title: 'Скидання пароля',
        codes_title: 'Ваші коди відновлення',
        codes_subtitle: 'Збережіть ці 10 кодів у надійному місці. Кожен код можна використати лише один раз для скидання пароля.',
        codes_warning: 'Ці коди більше не будуть показані. Завантажте їх зараз.',
        success_registered: 'Акаунт успішно створено!',
        success_reset: 'Пароль успішно скинуто! Збережіть нові коди відновлення.',
        err_email_required: 'Email обов\'язковий.',
        err_password_required: 'Пароль обов\'язковий.',
        err_passwords_mismatch: 'Паролі не збігаються.',
        err_min_password: 'Пароль повинен містити щонайменше 8 символів.',
        err_name_required: 'Ім\'я обов\'язкове.',
        err_code_required: 'Код відновлення обов\'язковий.',
        loading: 'Будь ласка, зачекайте…',
    },
    ro: {
        page_title: 'Finmatcher — Autentificare',
        subtitle: 'Asistent Financiar AI',
        tab_login: 'Autentificare',
        tab_register: 'Înregistrare',
        field_email: 'Email',
        field_password: 'Parolă',
        field_confirm_password: 'Confirmați parola',
        field_name: 'Nume complet',
        field_recovery_code: 'Cod de recuperare',
        field_new_password: 'Parolă nouă',
        field_confirm_new_password: 'Confirmați parola nouă',
        btn_login: 'Autentificare',
        btn_register: 'Creați cont',
        btn_reset: 'Resetați parola',
        btn_download: 'Descărcați codurile de recuperare',
        btn_continue: 'Continuați',
        btn_back: 'Înapoi la autentificare',
        link_forgot: 'Ați uitat parola?',
        link_no_account: 'Nu aveți cont? Înregistrați-vă',
        link_have_account: 'Aveți deja un cont? Autentificați-vă',
        reset_title: 'Resetarea parolei',
        codes_title: 'Codurile dvs. de recuperare',
        codes_subtitle: 'Păstrați aceste 10 coduri într-un loc sigur. Fiecare cod poate fi folosit o singură dată pentru resetarea parolei.',
        codes_warning: 'Aceste coduri nu vor mai fi afișate. Descărcați-le acum.',
        success_registered: 'Cont creat cu succes!',
        success_reset: 'Parola a fost resetată cu succes! Salvați noile coduri de recuperare.',
        err_email_required: 'Emailul este obligatoriu.',
        err_password_required: 'Parola este obligatorie.',
        err_passwords_mismatch: 'Parolele nu se potrivesc.',
        err_min_password: 'Parola trebuie să aibă cel puțin 8 caractere.',
        err_name_required: 'Numele este obligatoriu.',
        err_code_required: 'Codul de recuperare este obligatoriu.',
        loading: 'Vă rugăm să așteptați…',
    },
    vi: {
        page_title: 'Finmatcher — Đăng nhập',
        subtitle: 'Trợ lý Tài chính AI',
        tab_login: 'Đăng nhập',
        tab_register: 'Đăng ký',
        field_email: 'Email',
        field_password: 'Mật khẩu',
        field_confirm_password: 'Xác nhận mật khẩu',
        field_name: 'Họ và tên',
        field_recovery_code: 'Mã khôi phục',
        field_new_password: 'Mật khẩu mới',
        field_confirm_new_password: 'Xác nhận mật khẩu mới',
        btn_login: 'Đăng nhập',
        btn_register: 'Tạo tài khoản',
        btn_reset: 'Đặt lại mật khẩu',
        btn_download: 'Tải mã khôi phục',
        btn_continue: 'Tiếp tục',
        btn_back: 'Quay lại đăng nhập',
        link_forgot: 'Quên mật khẩu?',
        link_no_account: 'Chưa có tài khoản? Đăng ký',
        link_have_account: 'Đã có tài khoản? Đăng nhập',
        reset_title: 'Đặt lại mật khẩu',
        codes_title: 'Mã khôi phục của bạn',
        codes_subtitle: 'Lưu 10 mã này ở nơi an toàn. Mỗi mã chỉ có thể dùng một lần để đặt lại mật khẩu.',
        codes_warning: 'Các mã này sẽ không được hiển thị lại. Tải xuống ngay bây giờ.',
        success_registered: 'Tạo tài khoản thành công!',
        success_reset: 'Đặt lại mật khẩu thành công! Lưu các mã khôi phục mới bên dưới.',
        err_email_required: 'Email là bắt buộc.',
        err_password_required: 'Mật khẩu là bắt buộc.',
        err_passwords_mismatch: 'Mật khẩu không khớp.',
        err_min_password: 'Mật khẩu phải có ít nhất 8 ký tự.',
        err_name_required: 'Tên là bắt buộc.',
        err_code_required: 'Mã khôi phục là bắt buộc.',
        loading: 'Vui lòng đợi…',
    },
    ms: {
        page_title: 'Finmatcher — Log Masuk',
        subtitle: 'Pembantu Kewangan AI',
        tab_login: 'Log Masuk',
        tab_register: 'Daftar',
        field_email: 'E-mel',
        field_password: 'Kata Laluan',
        field_confirm_password: 'Sahkan Kata Laluan',
        field_name: 'Nama Penuh',
        field_recovery_code: 'Kod Pemulihan',
        field_new_password: 'Kata Laluan Baharu',
        field_confirm_new_password: 'Sahkan Kata Laluan Baharu',
        btn_login: 'Log Masuk',
        btn_register: 'Buat Akaun',
        btn_reset: 'Tetapkan Semula Kata Laluan',
        btn_download: 'Muat Turun Kod Pemulihan',
        btn_continue: 'Teruskan',
        btn_back: 'Kembali ke Log Masuk',
        link_forgot: 'Lupa kata laluan?',
        link_no_account: 'Tiada akaun? Daftar',
        link_have_account: 'Sudah ada akaun? Log Masuk',
        reset_title: 'Tetapkan Semula Kata Laluan',
        codes_title: 'Kod Pemulihan Anda',
        codes_subtitle: 'Simpan 10 kod ini di tempat yang selamat. Setiap kod hanya boleh digunakan sekali untuk menetapkan semula kata laluan.',
        codes_warning: 'Kod-kod ini tidak akan ditunjukkan lagi. Muat turun sekarang.',
        success_registered: 'Akaun berjaya dibuat!',
        success_reset: 'Kata laluan berjaya ditetapkan semula! Simpan kod pemulihan baharu anda.',
        err_email_required: 'E-mel diperlukan.',
        err_password_required: 'Kata laluan diperlukan.',
        err_passwords_mismatch: 'Kata laluan tidak sepadan.',
        err_min_password: 'Kata laluan mesti sekurang-kurangnya 8 aksara.',
        err_name_required: 'Nama diperlukan.',
        err_code_required: 'Kod pemulihan diperlukan.',
        loading: 'Sila tunggu…',
    },
};

function getLang(countryCode: string): Lang {
    const raw = COUNTRY_LANG_MAP[countryCode.toLowerCase()] ?? 'en';
    return (raw in TRANSLATIONS ? raw : 'en') as Lang;
}

// ─── HTML template ────────────────────────────────────────────────────────────

function buildAuthPage(countryCode: string): string {
    const lang = getLang(countryCode);
    const t = TRANSLATIONS[lang];
    const tJson = JSON.stringify(t);
    const apiBase = '/api/auth';

    return `<!DOCTYPE html>
<html lang="${lang}">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0">
<title>${t.page_title}</title>
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#f0f4f8;min-height:100vh;color:#1a202c}
.wrap{max-width:420px;margin:0 auto;padding:32px 16px 40px}
.logo{text-align:center;margin-bottom:28px}
.logo h1{font-size:26px;font-weight:800;color:#1a202c;letter-spacing:-0.5px}
.logo p{color:#718096;font-size:14px;margin-top:4px}
.card{background:#fff;border-radius:16px;padding:28px 24px;box-shadow:0 1px 3px rgba(0,0,0,.08),0 4px 16px rgba(0,0,0,.06)}
.tabs{display:flex;margin-bottom:24px;border-bottom:2px solid #e2e8f0}
.tab{flex:1;padding:10px 8px;text-align:center;cursor:pointer;color:#a0aec0;font-weight:600;font-size:15px;transition:color .15s}
.tab.active{color:#3b82f6;border-bottom:3px solid #3b82f6;margin-bottom:-2px}
.form-group{margin-bottom:16px}
label{display:block;font-size:13px;font-weight:600;color:#4a5568;margin-bottom:6px;text-transform:uppercase;letter-spacing:.4px}
input{width:100%;padding:13px 14px;border:1.5px solid #e2e8f0;border-radius:10px;font-size:16px;outline:none;transition:border-color .15s;background:#f7fafc;color:#1a202c}
input:focus{border-color:#3b82f6;background:#fff}
.btn{width:100%;padding:14px;border:none;border-radius:10px;font-size:16px;font-weight:700;cursor:pointer;transition:background .15s,opacity .15s;margin-top:4px}
.btn-primary{background:#3b82f6;color:#fff}
.btn-primary:hover{background:#2563eb}
.btn-primary:disabled{opacity:.6;cursor:not-allowed}
.btn-secondary{background:#edf2f7;color:#4a5568;margin-top:10px}
.btn-secondary:hover{background:#e2e8f0}
.btn-download{background:#059669;color:#fff;margin-top:0}
.btn-download:hover{background:#047857}
.link-row{text-align:center;margin-top:16px;font-size:14px;color:#718096}
.link-row a{color:#3b82f6;text-decoration:none;font-weight:500}
.link-row a:hover{text-decoration:underline}
.alert{padding:12px 14px;border-radius:8px;font-size:14px;margin-bottom:16px;line-height:1.5}
.alert-error{background:#fff5f5;color:#c53030;border:1px solid #fed7d7}
.alert-success{background:#f0fff4;color:#276749;border:1px solid #c6f6d5}
.hidden{display:none}
.codes-grid{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin:16px 0}
.code-chip{background:#edf2f7;border-radius:8px;padding:10px 8px;font-family:'Courier New',monospace;font-size:14px;font-weight:700;text-align:center;color:#2d3748;letter-spacing:.5px}
.codes-warning{color:#c53030;font-size:13px;text-align:center;margin:12px 0;font-weight:500}
.screen-title{font-size:20px;font-weight:700;margin-bottom:20px;color:#1a202c}
</style>
</head>
<body>
<div class="wrap">

<!-- ── AUTH SCREEN ── -->
<div id="s-auth">
  <div class="logo"><h1>Finmatcher</h1><p id="el-subtitle"></p></div>
  <div class="card">
    <div class="tabs">
      <div class="tab active" id="tab-login" onclick="showTab('login')"><span id="el-tab-login"></span></div>
      <div class="tab" id="tab-register" onclick="showTab('register')"><span id="el-tab-register"></span></div>
    </div>
    <div id="auth-alert" class="alert alert-error hidden"></div>

    <!-- Login form -->
    <form id="f-login" onsubmit="doLogin(event)">
      <div class="form-group"><label id="el-lbl-email-l"></label><input type="email" id="l-email" autocomplete="email" required></div>
      <div class="form-group"><label id="el-lbl-password-l"></label><input type="password" id="l-password" autocomplete="current-password" required></div>
      <button type="submit" class="btn btn-primary" id="btn-login"><span id="el-btn-login"></span></button>
    </form>

    <!-- Register form -->
    <form id="f-register" class="hidden" onsubmit="doRegister(event)">
      <div class="form-group"><label id="el-lbl-name"></label><input type="text" id="r-name" autocomplete="name" required></div>
      <div class="form-group"><label id="el-lbl-email-r"></label><input type="email" id="r-email" autocomplete="email" required></div>
      <div class="form-group"><label id="el-lbl-password-r"></label><input type="password" id="r-password" autocomplete="new-password" minlength="8" required></div>
      <div class="form-group"><label id="el-lbl-confirm-r"></label><input type="password" id="r-confirm" autocomplete="new-password" required></div>
      <button type="submit" class="btn btn-primary" id="btn-register"><span id="el-btn-register"></span></button>
    </form>

    <div class="link-row"><a href="#" id="el-link-forgot" onclick="showScreen('reset');return false;"></a></div>
  </div>
</div>

<!-- ── RESET SCREEN ── -->
<div id="s-reset" class="hidden">
  <div class="logo"><h1>Finmatcher</h1></div>
  <div class="card">
    <div id="el-reset-title" class="screen-title"></div>
    <div id="reset-alert" class="alert alert-error hidden"></div>
    <form id="f-reset" onsubmit="doReset(event)">
      <div class="form-group"><label id="el-lbl-email-rs"></label><input type="email" id="rs-email" required></div>
      <div class="form-group"><label id="el-lbl-code"></label><input type="text" id="rs-code" placeholder="XXXXX-XXXXX" autocomplete="off" required></div>
      <div class="form-group"><label id="el-lbl-newpw"></label><input type="password" id="rs-newpw" minlength="8" required></div>
      <div class="form-group"><label id="el-lbl-confirmnewpw"></label><input type="password" id="rs-confirmnewpw" required></div>
      <button type="submit" class="btn btn-primary" id="btn-reset"><span id="el-btn-reset"></span></button>
      <button type="button" class="btn btn-secondary" onclick="showScreen('auth')"><span id="el-btn-back"></span></button>
    </form>
  </div>
</div>

<!-- ── CODES SCREEN ── -->
<div id="s-codes" class="hidden">
  <div class="logo"><h1>Finmatcher</h1></div>
  <div class="card">
    <div id="el-codes-success" class="alert alert-success hidden"></div>
    <div id="el-codes-title" class="screen-title"></div>
    <p id="el-codes-subtitle" style="color:#718096;font-size:14px;line-height:1.6;margin-bottom:4px"></p>
    <div class="codes-grid" id="codes-grid"></div>
    <p id="el-codes-warning" class="codes-warning"></p>
    <button class="btn btn-download" onclick="downloadCodes()"><span id="el-btn-download"></span></button>
    <button class="btn btn-secondary" id="btn-continue" onclick="continueToApp()"><span id="el-btn-continue"></span></button>
  </div>
</div>

</div><!-- /wrap -->

<script>
(function(){
var t=${tJson};
var countryCode="${countryCode}";
var apiBase="${apiBase}";
var currentApiKey="";   // stored after login/register; used by continueToApp
var currentCodes=[];
var codesContext="register";

// Trigger the deep link via an anchor click rather than window.location.href.
// Browsers reject scheme names with underscores as valid URIs and resolve them
// as relative paths; an anchor click goes through the OS URL dispatcher instead.
function goToApp(apiKey){
  var a=document.createElement("a");
  a.href="finmatcher_global://?api_key="+encodeURIComponent(apiKey)+"&screen=ai_chat";
  a.style.display="none";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

// ── Apply translations ──────────────────────────────────────────────────────
function tx(id,key){var el=document.getElementById(id);if(el)el.textContent=t[key]||"";}
function applyT(){
  tx("el-subtitle","subtitle");
  tx("el-tab-login","tab_login");
  tx("el-tab-register","tab_register");
  tx("el-lbl-email-l","field_email");
  tx("el-lbl-password-l","field_password");
  tx("el-btn-login","btn_login");
  tx("el-lbl-name","field_name");
  tx("el-lbl-email-r","field_email");
  tx("el-lbl-password-r","field_password");
  tx("el-lbl-confirm-r","field_confirm_password");
  tx("el-btn-register","btn_register");
  tx("el-link-forgot","link_forgot");
  tx("el-reset-title","reset_title");
  tx("el-lbl-email-rs","field_email");
  tx("el-lbl-code","field_recovery_code");
  tx("el-lbl-newpw","field_new_password");
  tx("el-lbl-confirmnewpw","field_confirm_new_password");
  tx("el-btn-reset","btn_reset");
  tx("el-btn-back","btn_back");
  tx("el-codes-title","codes_title");
  tx("el-codes-subtitle","codes_subtitle");
  tx("el-codes-warning","codes_warning");
  tx("el-btn-download","btn_download");
  tx("el-btn-continue","btn_continue");
  document.title=t.page_title||"Finmatcher";
}

// ── Screen / tab helpers ───────────────────────────────────────────────────
function showScreen(name){
  ["auth","reset","codes"].forEach(function(s){
    document.getElementById("s-"+s).classList.toggle("hidden",s!==name);
  });
}
window.showScreen=showScreen;

function showTab(tab){
  ["login","register"].forEach(function(t){
    document.getElementById("tab-"+t).classList.toggle("active",t===tab);
    document.getElementById("f-"+t).classList.toggle("hidden",t!==tab);
  });
  clearAlert("auth-alert");
}
window.showTab=showTab;

// ── Alert helpers ──────────────────────────────────────────────────────────
function showAlert(id,msg,type){
  var el=document.getElementById(id);
  if(!el)return;
  el.textContent=msg;
  el.className="alert alert-"+(type||"error");
  el.classList.remove("hidden");
}
function clearAlert(id){
  var el=document.getElementById(id);
  if(el){el.textContent="";el.classList.add("hidden");}
}
function setLoading(btnId,isLoading){
  var btn=document.getElementById(btnId);
  if(!btn)return;
  btn.disabled=isLoading;
  if(isLoading){var sp=btn.querySelector("span");if(sp)sp.textContent=t.loading;}
  else{applyT();}
}

// ── Login ──────────────────────────────────────────────────────────────────
window.doLogin=function(e){
  e.preventDefault();
  clearAlert("auth-alert");
  var email=document.getElementById("l-email").value.trim();
  var password=document.getElementById("l-password").value;
  if(!email){showAlert("auth-alert",t.err_email_required);return;}
  if(!password){showAlert("auth-alert",t.err_password_required);return;}
  setLoading("btn-login",true);
  fetch(apiBase+"/login",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({email:email,password:password})})
    .then(function(r){return r.json();})
    .then(function(d){
      setLoading("btn-login",false);
      if(d.success){
        goToApp(d.api_key);
      } else {
        showAlert("auth-alert",d.error||"Error");
      }
    })
    .catch(function(){setLoading("btn-login",false);showAlert("auth-alert",t.err_password_required);});
};

// ── Register ───────────────────────────────────────────────────────────────
window.doRegister=function(e){
  e.preventDefault();
  clearAlert("auth-alert");
  var name=document.getElementById("r-name").value.trim();
  var email=document.getElementById("r-email").value.trim();
  var pw=document.getElementById("r-password").value;
  var cpw=document.getElementById("r-confirm").value;
  if(!name){showAlert("auth-alert",t.err_name_required);return;}
  if(!email){showAlert("auth-alert",t.err_email_required);return;}
  if(pw.length<8){showAlert("auth-alert",t.err_min_password);return;}
  if(pw!==cpw){showAlert("auth-alert",t.err_passwords_mismatch);return;}
  setLoading("btn-register",true);
  var clientId=new URLSearchParams(window.location.search).get("client_id")||undefined;
  fetch(apiBase+"/register",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({email:email,password:pw,name:name,country_code:countryCode,client_id:clientId})})
    .then(function(r){return r.json();})
    .then(function(d){
      setLoading("btn-register",false);
      if(d.success){
        currentApiKey=d.api_key||"";
        currentCodes=d.recovery_codes||[];
        codesContext="register";
        showCodesScreen(t.success_registered);
      } else {
        showAlert("auth-alert",d.error||"Error");
      }
    })
    .catch(function(){setLoading("btn-register",false);showAlert("auth-alert","Network error");});
};

// ── Reset Password ─────────────────────────────────────────────────────────
window.doReset=function(e){
  e.preventDefault();
  clearAlert("reset-alert");
  var email=document.getElementById("rs-email").value.trim();
  var code=document.getElementById("rs-code").value.trim();
  var npw=document.getElementById("rs-newpw").value;
  var cnpw=document.getElementById("rs-confirmnewpw").value;
  if(!email){showAlert("reset-alert",t.err_email_required);return;}
  if(!code){showAlert("reset-alert",t.err_code_required);return;}
  if(npw.length<8){showAlert("reset-alert",t.err_min_password);return;}
  if(npw!==cnpw){showAlert("reset-alert",t.err_passwords_mismatch);return;}
  setLoading("btn-reset",true);
  fetch(apiBase+"/reset-password",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({email:email,recovery_code:code,new_password:npw})})
    .then(function(r){return r.json();})
    .then(function(d){
      setLoading("btn-reset",false);
      if(d.success){
        currentCodes=d.recovery_codes||[];
        currentDeepLink="";
        codesContext="reset";
        showCodesScreen(t.success_reset);
      } else {
        showAlert("reset-alert",d.error||"Error");
      }
    })
    .catch(function(){setLoading("btn-reset",false);showAlert("reset-alert","Network error");});
};

// ── Codes screen ───────────────────────────────────────────────────────────
function showCodesScreen(successMsg){
  var successEl=document.getElementById("el-codes-success");
  if(successEl){
    successEl.textContent=successMsg;
    successEl.classList.remove("hidden");
  }
  var grid=document.getElementById("codes-grid");
  if(grid){
    grid.innerHTML=currentCodes.map(function(c){return'<div class="code-chip">'+c+'</div>';}).join("");
  }
  var continueBtn=document.getElementById("btn-continue");
  if(continueBtn){continueBtn.style.display=codesContext==="reset"?"":"block";}
  showScreen("codes");
}

window.downloadCodes=function(){
  if(!currentCodes.length)return;
  var header="Finmatcher — Recovery Codes\\nGenerated: "+new Date().toISOString()+"\\n\\nUse any of these codes once to reset your password.\\n\\n";
  var body=currentCodes.map(function(c,i){return(i+1)+". "+c;}).join("\\n");
  var footer="\\n\\n⚠ Keep these codes secret. Each code can only be used once.";
  var blob=new Blob([header+body+footer],{type:"text/plain"});
  var url=URL.createObjectURL(blob);
  var a=document.createElement("a");
  a.href=url;a.download="finmatcher-recovery-codes.txt";a.click();
  URL.revokeObjectURL(url);
};

window.continueToApp=function(){
  if(currentApiKey){goToApp(currentApiKey);}
  else{showScreen("auth");showTab("login");}
};

// ── Init ───────────────────────────────────────────────────────────────────
applyT();
var params=new URLSearchParams(window.location.search);
var initScreen=params.get("screen");
if(initScreen==="register"){showTab("register");}
else if(initScreen==="reset"){showScreen("reset");}

})();
</script>
</body>
</html>`;
}

// ─── Route handler ────────────────────────────────────────────────────────────

export function serveAuthPage(req: Request, res: Response): void {
    const countryCode = (req.params.country_code ?? '').toLowerCase();

    if (EXTERNAL_AUTH_COUNTRIES.has(countryCode)) {
        res.status(404).send('This country uses external authentication.');
        return;
    }

    if (!Object.prototype.hasOwnProperty.call(COUNTRY_LANG_MAP, countryCode)) {
        res.status(404).send('Country not supported.');
        return;
    }

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.send(buildAuthPage(countryCode));
}
