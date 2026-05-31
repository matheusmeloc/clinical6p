// ===== AUTENTICAÇÃO E PERFIL DO USUÁRIO =====
// Funções de verificação de sessão, logout, perfil, foto e configurações SMTP.

// ----- VERIFICAÇÃO DE SESSÃO -----

function checkAuth() {
    const userStr = localStorage.getItem('user');
    const token = localStorage.getItem('access_token');
    if (!userStr || !token) {
        window.location.href = '/login';
        return;
    }

    const user = JSON.parse(userStr);

    const userNameEl = document.querySelector('.user-name');
    const userRoleEl = document.querySelector('.user-role');
    const userAvatarEl = document.querySelector('.user-avatar');

    if (userNameEl) userNameEl.innerText = user.full_name;
    if (userRoleEl) userRoleEl.innerText = user.role === 'admin' ? 'Administrador' : 'Usuário';

    // Oculta aba de mensagens e sino para admin
    const msgNav = document.getElementById('nav-item-mensagens');
    const bellContainer = document.getElementById('nav-bell-container');
    if (msgNav) msgNav.style.display = user.role === 'admin' ? 'none' : 'flex';
    if (bellContainer) bellContainer.style.display = user.role === 'admin' ? 'none' : 'block';

    if (user.role !== 'admin') {
        updateUnreadBadge();
        setInterval(updateUnreadBadge, 60000);
    }

    if (userAvatarEl) {
        const profile = JSON.parse(localStorage.getItem('profile_' + user.email) || '{}');
        if (profile.photo) {
            userAvatarEl.innerText = '';
            userAvatarEl.style.backgroundImage = `url(${profile.photo})`;
            userAvatarEl.style.backgroundSize = 'cover';
            userAvatarEl.style.backgroundPosition = 'center';
        } else {
            userAvatarEl.innerText = user.full_name
                ? user.full_name.substring(0, 2).toUpperCase()
                : 'AU';
        }
    }
}

// ----- LOGOUT -----

function logout() {
    localStorage.removeItem('user');
    localStorage.removeItem('access_token');
    window.location.href = '/login';
}

// ----- PERFIL -----

function loadProfile() {
    const userStr = localStorage.getItem('user');
    if (!userStr) return;
    const user = JSON.parse(userStr);
    const profile = JSON.parse(localStorage.getItem('profile_' + user.email) || '{}');

    const titleEl = document.getElementById('profile-main-title');
    if (titleEl) titleEl.innerText = user.role === 'admin' ? 'Perfil do Administrador' : 'Perfil do Profissional';

    const nameEl = document.getElementById('profile-name');
    const emailEl = document.getElementById('profile-email');
    const phoneEl = document.getElementById('profile-phone');
    const roleTitleEl = document.getElementById('profile-role-title');
    const crpEl = document.getElementById('profile-crp');
    const photoEl = document.getElementById('profile-photo');

    if (nameEl) nameEl.value = user.full_name || '';
    if (emailEl) emailEl.value = user.email || '';
    if (phoneEl) phoneEl.value = user.phone || profile.phone || '';
    if (roleTitleEl) roleTitleEl.value = user.role_title || profile.role_title || '';
    if (crpEl) crpEl.value = user.crp || profile.crp || '';
    if (photoEl) {
        if (profile.photo) {
            photoEl.innerHTML = '';
            photoEl.style.backgroundImage = `url(${profile.photo})`;
            photoEl.style.backgroundSize = 'cover';
            photoEl.style.backgroundPosition = 'center';
        } else {
            photoEl.innerHTML = user.full_name ? user.full_name.substring(0, 2).toUpperCase() : 'AD';
            photoEl.style.backgroundImage = '';
        }
    }

    const emailCard = document.getElementById('email-config-card');
    if (user.role === 'admin' && emailCard) {
        emailCard.style.display = 'block';
        loadSystemSettings();
    } else if (emailCard) {
        emailCard.style.display = 'none';
    }
}

async function saveProfile(event) {
    event.preventDefault();
    const form = event.target;
    const formData = new FormData(form);
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const profile = JSON.parse(localStorage.getItem('profile_' + user.email) || '{}');

    profile.phone = formData.get('phone') || '';
    profile.role_title = formData.get('role_title') || '';
    profile.crp = formData.get('crp') || '';
    localStorage.setItem('profile_' + user.email, JSON.stringify(profile));

    const updatePayload = {};
    const newName = formData.get('full_name');
    if (newName) updatePayload.full_name = newName;

    const newPassword = formData.get('password');
    if (newPassword) updatePayload.password = newPassword;

    updatePayload.phone = formData.get('phone') || '';
    updatePayload.role_title = formData.get('role_title') || '';
    updatePayload.crp = formData.get('crp') || '';

    if (Object.keys(updatePayload).length > 0 && user.id) {
        const submitBtn = form.querySelector('button[type="submit"]');
        const originalText = submitBtn.innerHTML;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Salvando...';
        submitBtn.disabled = true;

        try {
            const response = await apiFetch(`/api/users/${user.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updatePayload)
            });
            if (response.ok) {
                const resData = await response.json();
                if (resData.full_name) {
                    user.full_name = resData.full_name;
                    user.phone = resData.phone;
                    user.role_title = resData.role_title;
                    user.crp = resData.crp;
                    localStorage.setItem('user', JSON.stringify(user));
                    checkAuth();
                }
                alert('Perfil salvo com sucesso!');
                const pwField = document.getElementById('profile-password');
                if (pwField) pwField.value = '';
            } else {
                alert('Erro ao atualizar dados no servidor.');
            }
        } catch (e) {
            console.error('Error updating user on server:', e);
            alert('Erro de conexão ao salvar perfil.');
        } finally {
            submitBtn.innerHTML = originalText;
            submitBtn.disabled = false;
        }
    } else if (newName) {
        user.full_name = newName;
        localStorage.setItem('user', JSON.stringify(user));
        checkAuth();
        alert('Perfil salvo com sucesso!');
    }
}

// ----- FOTO DE PERFIL -----

function handlePhotoUpload(event) {
    const file = event.target.files[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
        alert('Arquivo muito grande. Máximo 2MB.');
        return;
    }
    const reader = new FileReader();
    reader.onload = function (e) {
        const photoEl = document.getElementById('profile-photo');
        const avatarEl = document.querySelector('.user-avatar');
        const dataUrl = e.target.result;

        photoEl.innerHTML = '';
        photoEl.style.backgroundImage = `url(${dataUrl})`;
        photoEl.style.backgroundSize = 'cover';
        photoEl.style.backgroundPosition = 'center';

        if (avatarEl) {
            avatarEl.innerHTML = '';
            avatarEl.style.backgroundImage = `url(${dataUrl})`;
            avatarEl.style.backgroundSize = 'cover';
            avatarEl.style.backgroundPosition = 'center';
        }

        const user = JSON.parse(localStorage.getItem('user') || '{}');
        const profile = JSON.parse(localStorage.getItem('profile_' + user.email) || '{}');
        profile.photo = dataUrl;
        localStorage.setItem('profile_' + user.email, JSON.stringify(profile));
    };
    reader.readAsDataURL(file);
}

// ----- CONFIGURAÇÕES SMTP -----

async function loadSystemSettings() {
    try {
        const response = await apiFetch('/api/system/settings');
        const settings = await response.json();

        document.getElementById('smtp-server').value = settings.smtp_server || '';
        document.getElementById('smtp-port').value = settings.smtp_port || 587;
        document.getElementById('smtp-username').value = settings.smtp_username || '';
        document.getElementById('smtp-password').value = settings.smtp_password || '';
        document.getElementById('smtp-from-email').value = settings.smtp_from_email || '';
    } catch (e) {
        console.error('Error loading system settings:', e);
    }
}

async function saveSystemSettings(e) {
    e.preventDefault();
    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData);

    data.smtp_port = data.smtp_port ? parseInt(data.smtp_port) : 587;

    const submitBtn = e.target.querySelector('button[type="submit"]');
    const originalText = submitBtn.innerHTML;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Salvando...';
    submitBtn.disabled = true;

    try {
        const response = await apiFetch('/api/system/settings', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });

        if (response.ok) {
            alert('Configurações de E-mail salvas com sucesso!');
        } else {
            const err = await response.json();
            alert('Erro ao salvar as configurações: ' + JSON.stringify(err));
        }
    } catch (e) {
        console.error('Error saving system settings:', e);
        alert('Erro de conexão ao salvar configurações.');
    } finally {
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
    }
}
