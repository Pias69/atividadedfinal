# 🌱 EcoFactory - Sistema de Monitoramento Industrial & IoT

![NodeJS](https://img.shields.io/badge/Node.js-68A063?style=for-the-badge&logo=node.js&logoColor=white)
![Express.js](https://img.shields.io/badge/Express.js-000000?style=for-the-badge&logo=express&logoColor=white)
![MySQL](https://img.shields.io/badge/MySQL-00000F?style=for-the-badge&logo=mysql&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)
![License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)

O **EcoFactory** é uma plataforma full-stack para monitoramento de equipamentos industriais, consumo de energia, gestão de alertas de temperatura e controle de perfil de operadores em tempo real.

---

## 📌 Índice

- [Sobre o Projeto](#-sobre-o-projeto)
- [Funcionalidades](#-funcionalidades)
- [Tecnologias Utilizadas](#-tecnologias-utilizadas)
- [Estrutura do Projeto](#-estrutura-do-projeto)
- [Configuração do Banco de Dados](#-configuração-do-banco-de-dados)
- [Passo a Passo de Instalação e Execução](#-passo-a-passo-de-instalação-e-execução)
- [Rotas da API REST](#-rotas-da-api-rest)
- [Como Contribuir](#-como-contribuir)
- [Licença](#-licença)

---

## 💻 Sobre o Projeto

O **EcoFactory** foi desenvolvido para centralizar o controle de máquinas industriais de uma fábrica inteligente. O sistema analisa métricas de desempenho e temperatura coletadas de sensores, alertando os operadores em caso de sobreaquecimento e permitindo a gestão personalizada do perfil dos usuários cadastrados.

---

## 🚀 Funcionalidades

- [x] **📊 Dashboard Inteligente:** KPIs com contagem de máquinas ativas, temperatura média do parque fabril e total de alertas.
- [x] **⚙️ Gerenciamento de Máquinas:** Cadastro e remoção de equipamentos com atualização em tempo real.
- [x] **🚨 Central de Alertas:** Detecção automática de sobreaquecimento (temperaturas ≥ 70°C).
- [x] **👤 Perfil do Usuário & Foto:** Modal com dados da conta e upload de foto de perfil do computador armazenada em formato Base64.
- [x] **🔐 Autenticação Segura:** Cadastro e login de usuários com senhas criptografadas usando `bcryptjs`.
- [x] **📱 Interface Responsiva:** Layout adaptável para desktops e tablets desenvolvido com CSS moderno.

---

## 🛠️ Tecnologias Utilizadas

### **Frontend**
* **HTML5:** Estruturação semântica e acessível.
* **CSS3:** Estilização com variáveis CSS, CSS Grid, Flexbox e efeitos de transição.
* **JavaScript (ES6+):** Manipulação da DOM, chamadas de API via `Fetch API` e conversão de imagem via `FileReader`.

### **Backend**
* **Node.js:** Ambiente de execução para o servidor.
* **Express.js:** Framework para criação das rotas da API REST.
* **MySQL2:** Conexão otimizada com o banco de dados MySQL via pool de conexões.
* **Bcryptjs:** Criptografia de senhas dos usuários.
* **Cors:** Liberação de requisições de origens cruzadas.
* **Dotenv:** Gerenciamento de variáveis de ambiente.

### **Banco de Dados**
* **MySQL:** Banco de dados relacional para armazenamento de usuários e máquinas.

---

## 📁 Estrutura do Projeto

```text
ecofactory/
├── backend/
│   └── server.js          # Servidor Node.js e rotas da API REST
├── frontend/
│   ├── index.html         # Estrutura e modais da aplicação
│   ├── style.css          # Estilização completa do dashboard
│   └── app.js             # Lógica do client-side e integração com API
├── .env                   # Variáveis de ambiente (DB Host, User, Pass)
├── database.sql           # Script de criação do banco de dados e tabelas
├── package.json           # Dependências e scripts do Node.js
└── README.md              # Documentação oficial do projeto
