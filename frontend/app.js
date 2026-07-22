
// URLs das APIs da aplicação Node.js
const API_MAQUINAS = 'http://localhost:3000/api/maquinas';
const API_CONFIG = 'http://localhost:3000/api/configuracoes';

let maquinas = [];
let selectedStatus = 'online';

// Elementos do DOM - Formulários e Modais
const modalForm = document.getElementById('modal-form');
const btnOpenModal = document.getElementById('btn-open-modal');
const btnCloseModal = document.getElementById('btn-close-modal');
const btnCancelModal = document.getElementById('btn-cancel-modal');
const maquinaForm = document.getElementById('maquina-form');
const configForm = document.getElementById('form-configuracoes');

const tempInput = document.getElementById('temp-input');
const tempVal = document.getElementById('temp-val');
const cargaInput = document.getElementById('carga-input');
const cargaVal = document.getElementById('carga-val');

const navButtons = document.querySelectorAll('.nav-btn');
const tabViews = document.querySelectorAll('.tab-view');

// -------------------------------------------------------------
// 1. NAVEGAÇÃO DE ABAS
// -------------------------------------------------------------
navButtons.forEach(btn => {
  btn.addEventListener('click', () => {
    const tab = btn.dataset.tab;
    navButtons.forEach(b => b.classList.remove('active'));
    tabViews.forEach(v => v.classList.remove('active'));

    btn.classList.add('active');
    const targetView = document.getElementById(`view-${tab}`);
    if (targetView) targetView.classList.add('active');
  });
});

// -------------------------------------------------------------
// 2. CONTROLE DO MODAL E SLIDERS
// -------------------------------------------------------------
if (btnOpenModal) btnOpenModal.addEventListener('click', () => modalForm.classList.remove('hidden'));
if (btnCloseModal) btnCloseModal.addEventListener('click', () => modalForm.classList.add('hidden'));
if (btnCancelModal) btnCancelModal.addEventListener('click', () => modalForm.classList.add('hidden'));

if (tempInput) {
  tempInput.addEventListener('input', (e) => tempVal.innerText = `${e.target.value}°C`);
}
if (cargaInput) {
  cargaInput.addEventListener('input', (e) => cargaVal.innerText = `${e.target.value}%`);
}

// Seleção de Status no Modal
document.querySelectorAll('.status-pill').forEach(pill => {
  pill.addEventListener('click', () => {
    document.querySelectorAll('.status-pill').forEach(p => p.className = 'status-pill');
    selectedStatus = pill.dataset.status;
    pill.classList.add(`active-${selectedStatus}`);
  });
});

// -------------------------------------------------------------
// 3. OPERAÇÕES COM MÁQUINAS (FETCH API)
// -------------------------------------------------------------

// 🟢 GET /api/maquinas - Carregar do MySQL
async function carregarMaquinas() {
  try {
    const res = await fetch(API_MAQUINAS);
    if (!res.ok) throw new Error('Erro ao buscar máquinas');
    maquinas = await res.json();
    render();
  } catch (err) {
    console.error("Erro ao carregar máquinas da API:", err);
  }
}

// 🔵 POST /api/maquinas - Criar Nova Máquina
if (maquinaForm) {
  maquinaForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const novaMaquina = {
      nome: document.getElementById('nome-input').value,
      setor: document.getElementById('setor-input').value,
      status: selectedStatus,
      temp: tempInput.value,
      carga: cargaInput.value
    };

    try {
      const res = await fetch(API_MAQUINAS, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(novaMaquina)
      });

      if (res.ok) {
        await carregarMaquinas();
        maquinaForm.reset();
        modalForm.classList.add('hidden');
      } else {
        const erro = await res.json();
        alert(`Erro: ${erro.erro}`);
      }
    } catch (err) {
      console.error("Erro ao cadastrar máquina:", err);
    }
  });
}

// 🔴 DELETE /api/maquinas/:id - Remover Máquina
async function deletarMaquina(id) {
  if (!confirm("Tem certeza que deseja remover esta máquina?")) return;

  try {
    const res = await fetch(`${API_MAQUINAS}/${id}`, { method: 'DELETE' });
    if (res.ok) {
      await carregarMaquinas();
    } else {
      alert("Não foi possível excluir a máquina.");
    }
  } catch (err) {
    console.error("Erro ao deletar máquina:", err);
  }
}

// Expor a função globalmente para uso no onclick da tabela
window.deletarMaquina = deletarMaquina;

// -------------------------------------------------------------
// 4. OPERAÇÕES COM CONFIGURAÇÕES (FETCH API)
// -------------------------------------------------------------

// 🟢 GET /api/configuracoes - Carregar parâmetros do MySQL
async function carregarConfiguracoes() {
  try {
    const res = await fetch(API_CONFIG);
    if (!res.ok) return;

    const config = await res.json();
    
    if (document.getElementById('cfg-nome-empresa')) {
      document.getElementById('cfg-nome-empresa').value = config.nome_empresa || '';
      document.getElementById('cfg-temp-limite').value = config.temp_limite_alerta || 80;
      document.getElementById('cfg-email-alerta').value = config.email_alerta || '';
      document.getElementById('cfg-notificacoes').checked = Boolean(config.notificacoes_email);
      document.getElementById('cfg-manutencao').checked = Boolean(config.modo_manutencao);
    }
  } catch (err) {
    console.error("Erro ao carregar configurações:", err);
  }
}

// 🟡 PUT /api/configuracoes - Salvar parâmetros no MySQL
if (configForm) {
  configForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const dadosConfig = {
      nome_empresa: document.getElementById('cfg-nome-empresa').value,
      temp_limite_alerta: document.getElementById('cfg-temp-limite').value,
      email_alerta: document.getElementById('cfg-email-alerta').value,
      notificacoes_email: document.getElementById('cfg-notificacoes').checked,
      modo_manutencao: document.getElementById('cfg-manutencao').checked
    };

    try {
      const res = await fetch(API_CONFIG, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dadosConfig)
      });

      if (res.ok) {
        alert("✅ Configurações salvas com sucesso!");
      } else {
        alert("❌ Falha ao salvar configurações.");
      }
    } catch (err) {
      console.error("Erro ao salvar configurações:", err);
    }
  });
}

// -------------------------------------------------------------
// 5. RENDERIZAÇÃO E CÁLCULO DE KPIS
// -------------------------------------------------------------
function render() {
  const total = maquinas.length;
  const online = maquinas.filter(m => m.status === 'online').length;
  const alertas = maquinas.filter(m => m.status === 'atencao' || m.status === 'offline').length;
  const cargaMedia = total > 0 ? Math.round(maquinas.reduce((a, b) => a + Number(b.carga), 0) / total) : 0;

  // Atualização dos Indicadores (KPIs)
  if (document.getElementById('kpi-online')) document.getElementById('kpi-online').innerText = `${online} / ${total}`;
  if (document.getElementById('kpi-alertas')) document.getElementById('kpi-alertas').innerText = alertas;
  if (document.getElementById('badge-alertas')) document.getElementById('badge-alertas').innerText = alertas;
  if (document.getElementById('kpi-carga')) document.getElementById('kpi-carga').innerText = `${cargaMedia}%`;

  // Renderizar Lista de Atividades Recentes
  const listEl = document.getElementById('activity-list');
  if (listEl) {
    listEl.innerHTML = maquinas.map(m => `
      <li class="activity-item">
        <div class="activity-info">
          <span class="status-dot ${m.status}">◉</span>
          <strong>${m.nome}</strong> — <span>${m.msg || 'Operação registrada'}</span>
        </div>
        <span class="activity-time">${m.hora || '--:--'}</span>
      </li>
    `).join('');
  }

  // Renderizar Tabela de Máquinas
  const tableEl = document.getElementById('table-maquinas-body');
  if (tableEl) {
    tableEl.innerHTML = maquinas.map(m => `
      <tr>
        <td><strong>${m.nome}</strong></td>
        <td>${m.setor}</td>
        <td>
          <span class="status-dot ${m.status}">◉</span>
          <span style="text-transform: capitalize">${m.status}</span>
        </td>
        <td>${m.temp}°C</td>
        <td>${m.carga}%</td>
        <td>
          <button onclick="deletarMaquina(${m.id})" style="background:none; border:none; cursor:pointer;" title="Excluir máquina">
            🗑️
          </button>
        </td>
      </tr>
    `).join('');
  }
}

// -------------------------------------------------------------
// INICIALIZAÇÃO DA APLICAÇÃO
// -------------------------------------------------------------
carregarMaquinas();
carregarConfiguracoes();