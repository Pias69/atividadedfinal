# ⚙️ EcoFactory - Painel Industrial de Ativos

O **EcoFactory** é uma solução de monitoramento em tempo real para ativos e máquinas industriais. Este projeto foi reestruturado para utilizar tecnologias web nativas no front-end e um servidor REST ágil no back-end, garantindo alta performance, simplicidade de manutenção e zero dependências complexas de frameworks.

---

## 📂 Estrutura do Projeto

O repositório é dividido de forma clara em duas partes essenciais:

```text
ecofactory-classic/
├── backend/                  # Servidor API Express (Node.js)
│   ├── package.json          # Dependências do back-end
│   └── server.js             # Código da API e banco de dados em memória
│
├── frontend/                 # Interface do Usuário (Vanilla Web)
│   ├── index.html            # Estrutura e marcação das telas
│   ├── style.css             # Estilização moderna e responsiva
│   └── app.js                # Lógica do cliente e requisições HTTP (Fetch)
│
└── README.md                 # Instruções de uso do projeto
