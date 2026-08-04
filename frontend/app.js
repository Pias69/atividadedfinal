document.addEventListener('DOMContentLoaded', () => {
  verificarSessao();
  carregarMaquinas();
});

// ==========================================
// CONTROLE DE AUTENTICAÇÃO E SESSÃO
// ==========================================
const authModal = document.getElementById('auth-modal');
const formLogin = document.getElementById('form-login');
const formCadastro = document.getElementById('form-cadastro');

if (document.getElementById('link-ir-cadastro')) {
  document.getElementById('link-ir-cadastro').addEventListener('click', (e) => {
    e.preventDefault();
    formLogin.style.display = 'none';
    formCadastro.style.display = 'flex';
  });
}

if (document.getElementById('link-ir-login')) {
  document.getElementById('link-ir-login').addEventListener('click', (e) => {
    e.preventDefault();
    formCadastro.style.display = 'none';
    formLogin.style.display = 'flex';
  });
}

function verificarSessao() {
  let usuarioSalvo = JSON.parse(localStorage.getItem('usuarioLogado'));

  // Auto-login de Teste para evitar modal bloqueando a tela inicial
  if (!usuarioSalvo) {
    usuarioSalvo = { id: 1, nome: 'Operador EcoFactory', email: 'operador@ecofactory.com' };
    localStorage.setItem('usuarioLogado', JSON.stringify(usuarioSalvo));
  }

  if (authModal) authModal.style.display = 'none';
  document.getElementById('sidebar-user-nome').innerText = usuarioSalvo.nome;
  
  const inicial = usuarioSalvo.nome ? usuarioSalvo.nome.charAt(0).toUpperCase() : 'U';
  document.getElementById('header-avatar-initial').innerText = inicial;
}

// ==========================================
// CARREGAR MÁQUINAS E ALERTAS
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

    // Atualiza KPIs do topo
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

// ADICIONAR E DELETAR MÁQUINA
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
  'seguranca': 'Segurança SST (Saúde e Segurança do Trabalho)',
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