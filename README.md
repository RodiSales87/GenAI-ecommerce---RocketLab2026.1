# 🚀 Rocket Lab 2026 - Atividade GenAI: Agente de E-Commerce

## 📌 Sobre o Projeto

Este projeto foi desenvolvido para a atividade GenAI do Visagio Rocket Lab 2026. Consiste em um agente de Inteligência Artificial desenhado para realizar consultas e análises sobre dados de um banco de dados de um Sistema de Gerenciamento de E-Commerce. A aplicação permite que usuários não técnicos executem consultas de leitura diretamente no banco de dados através de linguagem natural (Text-to-SQL) e realizem análises de dados em tempo real.

A stack principal estabelecida para o desenvolvimento engloba a linguagem Python e o modelo Gemini 2.5 Flash/Flash Lite. Para a manipulação dos dados, o sistema utiliza um banco de dados SQLite3 embutido (através do arquivo `banco.db`), que já contempla as sete tabelas fundamentais do e-commerce: `dim_consumidores`, `dim_produtos`, `dim_vendedores`, `fat_pedidos`, `fat_pedido_total`, `fat_itens_pedidos` e `fat_avaliacoes_pedidos`.

## 📂 Organização do Código

O fluxo de desenvolvimento e a arquitetura do projeto estão divididos em duas fases principais:

* **Ambiente de Testes (Notebook):** Inicialmente, um Jupyter Notebook foi utilizado para desenvolver a lógica base, estruturar a conexão e testar o funcionamento do agente de IA de forma isolada. Nesta etapa, foram validados os prompts e as lógicas de Text-to-SQL exemplificadas na atividade.
* **Módulo de Aplicação e Interface:** Após a validação, o projeto evoluiu para uma integração full-stack. As operações principais foram migradas e consolidadas no arquivo `main.py` no diretório de backend. Adicionalmente, foi desenvolvida uma interface de usuário rica com Vite, onde os usuários podem interagir com o agente. A interface suporta o gerenciamento completo das sessões de conversa, permitindo criar múltiplos chats, editar os seus respectivos nomes e excluí-los conforme necessário.

## ⚙️ Pré-requisitos

Para garantir o funcionamento adequado da aplicação, você precisará de:

* Python 3.x instalado em sua máquina.
* Gerenciador de pacotes Node (npm) para rodar o frontend.
* Chave de acesso ativa da API do Google Gemini.

## 🚀 Passo a Passo para Execução

Siga os passos abaixo para configurar e rodar o projeto no seu ambiente local:

### 1. Instalar as dependências

Você precisará instalar as dependências tanto do lado do servidor (backend) quanto do cliente (frontend).

**Backend:**

Abra o terminal, navegue até a pasta `/backend` e instale as bibliotecas Python listadas.

```bash
cd backend
pip install -r requirements.txt
```

**Frontend:**

Em seguida, navegue até a pasta `/frontend` e instale as dependências do Vite/Node.

```bash
cd ../frontend
npm install
```

### 2. Configurar Variáveis de Ambiente

Crie um arquivo `.env` na raiz da pasta `/backend` para armazenar suas credenciais de forma segura. Adicione a sua chave do Google Gemini neste arquivo:

```env
GEMINI_API_KEY=sua_chave_da_api_aqui
```

### 3. Iniciar o Backend

* Abra um terminal na raiz do projeto e acesse a pasta do servidor:
  ```bash
  cd backend
  ```
* Ative o seu ambiente virtual (venv):
  * **Windows:**
    ```bash
    .\venv\Scripts\activate
    ```
  * **Linux/macOS:**
    ```bash
    source venv/bin/activate
    ```
* Com o ambiente ativo, execute o servidor para inicializar o módulo de backend FastAPI:
  ```bash
  python -m uvicorn main:app --reload
  ```

### 4. Iniciar o Frontend

* Abra um *segundo* terminal e navegue até a pasta `/frontend`.
* Rode o servidor de desenvolvimento do Vite com o comando:

```bash
npm run dev
```

### 5. Acessar a Aplicação

Com os servidores do backend e frontend rodando simultaneamente, acesse a URL local (geralmente `http://localhost:5173` ou a porta informada pelo Vite no terminal) em um navegador de sua preferência para utilizar o agente.
