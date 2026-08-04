document.addEventListener('DOMContentLoaded', () => {
  verificarSessao();
  carregarMaquinas();
  configurarEventosPerfil();
});

// ==========================================
// CONTROLE DE SESSÃO E PERFIL
// ==========================================
const authModal = document.getElementById('auth-modal');
const modalPerfil = document.getElementById('modal-perfil');

function verificarSessao() {
  let usuarioSalvo = JSON.parse(localStorage.getItem('usuarioLogado'));

  if (!usuarioSalvo) {
    usuarioSalvo = { id: 1, nome: 'Operador EcoFactory', email: 'operador@ecofactory.com' };
    localStorage.setItem('usuarioLogado', JSON.stringify(usuarioSalvo));
  }

  if (authModal) authModal.style.display = 'none';
  
  const nomeElem = document.getElementById('sidebar-user-nome');
  if (nomeElem) nomeElem.innerText = usuarioSalvo.nome;
  
  const inicial = usuarioSalvo.nome ? usuarioSalvo.nome.charAt(0).toUpperCase() : 'U';
  const avatarElem = document.getElementById('header-avatar-initial');
  if (avatarElem) avatarElem.innerText = inicial;

  if (usuarioSalvo.foto) {
    atualizarExibicaoFoto(usuarioSalvo.foto);
  }
}

function configurarEventosPerfil() {
  const btnHeaderPerfil = document.getElementById('btn-header-perfil');
  const btnSidebarPerfil = document.getElementById('btn-abrir-perfil-sidebar');
  const btnFecharPerfil = document.getElementById('btn-fechar-perfil');
  const btnLogout = document.getElementById('btn-logout');

  if (btnHeaderPerfil) btnHeaderPerfil.addEventListener('click', abrirModalPerfil);
  if (btnSidebarPerfil) btnSidebarPerfil.addEventListener('click', abrirModalPerfil);
  if (btnFecharPerfil) btnFecharPerfil.addEventListener('click', fecharModalPerfil);
  if (btnLogout) btnLogout.addEventListener('click', fazerLogout);

  configurarUploadFoto();
}

function configurarUploadFoto() {
  const avatarContainer = document.getElementById('avatar-container');
  const inputFoto = document.getElementById('input-foto-perfil');

  if (!avatarContainer || !inputFoto) return;

  avatarContainer.addEventListener('click', () => inputFoto.click());

  inputFoto.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const base64Image = event.target.result;

      atualizarExibicaoFoto(base64Image);

      const usuario = JSON.parse(localStorage.getItem('usuarioLogado')) || {};
      usuario.foto = base64Image;
      localStorage.setItem('usuarioLogado', JSON.stringify(usuario));

      if (usuario.id) {
        try {
          await fetch(`/api/perfil/${usuario.id}/foto`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ foto: base64Image })
          });
        } catch (err) {
          console.error('Erro ao salvar foto no servidor:', err);
        }
      }
    };

    reader.readAsDataURL(file);
  });
}

function atualizarExibicaoFoto(fotoBase64) {
  const headerSpan = document.getElementById('header-avatar-initial');
  const headerImg = document.getElementById('header-avatar-img');
  const modalSpan = document.getElementById('profile-initials');
  const modalImg = document.getElementById('profile-img');

  if (fotoBase64) {
    if (headerImg) { headerImg.src = fotoBase64; headerImg.style.display = 'block'; }
    if (headerSpan) { headerSpan.style.display = 'none'; }
    if (modalImg) { modalImg.src = fotoBase64; modalImg.style.display = 'block'; }
    if (modalSpan) { modalSpan.style.display = 'none'; }
  } else {
    if (headerImg) headerImg.style.display = 'none';
    if (headerSpan) headerSpan.style.display = 'inline';
    if (modalImg) modalImg.style.display = 'none';
    if (modalSpan) modalSpan.style.display = 'inline';
  }
}

async function abrirModalPerfil() {
  if (!modalPerfil) return;
  modalPerfil.classList.remove('hidden');
  
  const usuario = JSON.parse(localStorage.getItem('usuarioLogado'));
  if (!usuario) return;

  try {
    const res = await fetch(`/api/perfil/${usuario.id}`);
    if (res.ok) {
      const dados = await res.json();
      preencherDadosPerfil(dados.nome, dados.email, dados.id, dados.created_at, dados.foto);
    } else {
      preencherDadosPerfil(usuario.nome, usuario.email, usuario.id, null, usuario.foto);
    }
  } catch (err) {
    preencherDadosPerfil(usuario.nome, usuario.email, usuario.id, null, usuario.foto);
  }
}

function preencherDadosPerfil(nome, email, id, criadoEm, foto) {
  const inicial = nome ? nome.charAt(0).toUpperCase() : 'U';
  document.getElementById('profile-initials').innerText = inicial;
  document.getElementById('profile-nome').innerText = nome || 'Operador';
  document.getElementById('profile-email').innerText = email || 'operador@ecofactory.com';
  document.getElementById('profile-id').innerText = `#${id || 1}`;
  
  if (criadoEm) {
    document.getElementById('profile-data').innerText = new Date(criadoEm).toLocaleDateString('pt-BR');
  } else {
    document.getElementById('profile-data').innerText = 'Recente';
  }

  const usuarioSalvo = JSON.parse(localStorage.getItem('usuarioLogado'));
  const fotoParaExibir = foto || (usuarioSalvo ? usuarioSalvo.foto : null);
  atualizarExibicaoFoto(fotoParaExibir);
}

function fecharModalPerfil() {
  if (modalPerfil) modalPerfil.classList.add('hidden');
}

function fazerLogout() {
  localStorage.removeItem('usuarioLogado');
  location.reload();
}

// ==========================================
// MÁQUINAS E ALERTAS
// ==========================================
async function carregarMaquinas() {
  try {
    const res = await fetch('/api/maquinas');
    const maquinas = await res.json();

    const tbodyDash = document.getElementById('tabela-maquinas-dash');
    const tbodyGerenciador = document.getElementById('tabela-maquinas-gerenciar');
    const tbodyAlertas = document.getElementById('tabela-alertas');

    if (tbodyDash) tbodyDash.innerHTML = '';
    if (tbodyGerenciador) tbodyGerenciador.innerHTML = '';
    if (tbodyAlertas) tbodyAlertas.innerHTML = '';

    let totalTemp = 0;
    let totalOnline = 0;
    let alertasCount = 0;

    maquinas.forEach(m => {
      const temp = Number(m.temperatura || 0);
      totalTemp += temp;
      if (m.status === 'online') totalOnline++;

      const isAlerta = temp >= 70;
      if (isAlerta) {
        alertasCount++;
        if (tbodyAlertas) {
          tbodyAlertas.innerHTML += `
            <tr>
              <td><span class="tag-status danger">CRÍTICO</span></td>
              <td><strong>${m.nome}</strong></td>
              <td>${m.setor}</td>
              <td><strong style="color: var(--accent-danger);">${temp} °C</strong></td>
              <td>Sobreaquecimento detectado no sensor.</td>
              <td><span class="tag-status warning">Ativo</span></td>
            </tr>
          `;
        }
      }

      if (tbodyDash) {
        tbodyDash.innerHTML += `
          <tr>
            <td><strong>${m.nome}</strong></td>
            <td>${m.setor}</td>
            <td><span class="tag-status ${isAlerta ? 'danger' : 'green'}">${isAlerta ? 'Atenção' : m.status}</span></td>
            <td><strong style="color: ${isAlerta ? 'var(--accent-danger)' : 'inherit'}">${temp}°C</strong></td>
            <td><button onclick="deletarMaquina(${m.id})" style="background:transparent; border:none; color:var(--accent-danger); font-weight:600; cursor:pointer;">Excluir</button></td>
          </tr>
        `;
      }

      if (tbodyGerenciador) {
        tbodyGerenciador.innerHTML += `
          <tr>
            <td>#${m.id}</td>
            <td>${m.nome}</td>
            <td>${m.setor}</td>
            <td><span class="tag-status green">${m.status}</span></td>
            <td>${m.consumo || 120} kWh</td>
            <td><button onclick="deletarMaquina(${m.id})" style="background:var(--accent-danger-light); border: 1px solid #fca5a5; color:var(--accent-danger); padding:4px 10px; border-radius:6px; font-weight:600; cursor:pointer;">Excluir</button></td>
          </tr>
        `;
      }
    });

    if (alertasCount === 0 && tbodyAlertas) {
      tbodyAlertas.innerHTML = `
        <tr>
          <td colspan="6" style="text-align: center; color: var(--text-muted); padding: 20px;">
            ✅ Nenhum alerta ativo. Todas as máquinas operando em temperatura segura.
          </td>
        </tr>
      `;
    }

    document.getElementById('sidebar-alert-badge').innerText = alertasCount;
    document.getElementById('header-notif-count').innerText = alertasCount;
    document.getElementById('kpi-alertas-count').innerText = alertasCount;
    document.getElementById('alert-summary-tag').innerText = `${alertasCount} Ocorrência(s) Crítica(s)`;

    document.getElementById('kpi-total').innerText = maquinas.length;
    document.getElementById('kpi-online').innerText = totalOnline;
    const mediaTemp = maquinas.length > 0 ? (totalTemp / maquinas.length).toFixed(1) : 0;
    document.getElementById('kpi-temp').innerText = `${mediaTemp} °C`;

  } catch (err) {
    console.error('Erro ao carregar máquinas:', err);
  }
}

// ADICIONAR E EXCLUIR MÁQUINA
const modalMaquina = document.getElementById('modal-maquina');
if (document.getElementById('btn-nova-maquina')) {
  document.getElementById('btn-nova-maquina').addEventListener('click', () => modalMaquina.classList.remove('hidden'));
}
if (document.getElementById('btn-fechar-maquina')) {
  document.getElementById('btn-fechar-maquina').addEventListener('click', () => modalMaquina.classList.add('hidden'));
}

if (document.getElementById('form-maquina')) {
  document.getElementById('form-maquina').addEventListener('submit', async (e) => {
    e.preventDefault();
    const nome = document.getElementById('maq-nome').value;
    const setor = document.getElementById('maq-setor').value;
    const temperatura = document.getElementById('maq-temp').value;

    await fetch('/api/maquinas', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nome, setor, temperatura })
    });

    modalMaquina.classList.add('hidden');
    carregarMaquinas();
  });
}

async function deletarMaquina(id) {
  if (confirm('Deseja realmente excluir este equipamento?')) {
    await fetch(`/api/maquinas/${id}`, { method: 'DELETE' });
    carregarMaquinas();
  }
}

// NAVEGAÇÃO ENTRE ABAS
const titles = {
  'dashboard': 'Painel Geral',
  'maquinas': 'Gerenciamento de Máquinas',
  'producao': 'Controle de Produção',
  'seguranca': 'Segurança SST',
  'alertas': 'Central de Alertas',
  'relatorios': 'Relatórios e Desempenho',
  'config': 'Configurações do Sistema'
};

function alternarAba(tabKey) {
  document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
  document.querySelectorAll('.tab-view').forEach(t => t.classList.remove('active'));

  const btn = document.querySelector(`.nav-btn[data-tab="${tabKey}"]`);
  if (btn) btn.classList.add('active');

  const tabElem = document.getElementById(`tab-${tabKey}`);
  if (tabElem) tabElem.classList.add('active');

  document.getElementById('page-title').innerText = titles[tabKey] || 'EcoFactory';
}

document.querySelectorAll('.nav-btn').forEach(btn => {
  btn.addEventListener('click', () => alternarAba(btn.dataset.tab));
});

if (document.getElementById('btn-header-notif')) {
  document.getElementById('btn-header-notif').addEventListener('click', () => alternarAba('alertas'));
}