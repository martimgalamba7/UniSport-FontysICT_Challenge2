# UniSport — Academic Research Survey Web Application

> **Project:** Fontys ICT — Semester 1, Block 2 (Challenge 2: Student Sports Community Platform)  
> **Database Backend:** **Google Sheets (via Google Apps Script Webhook API)**  
> **Location:** Eindhoven, Netherlands  

---

## 📌 Visão Geral / Overview
O **UniSport** é uma aplicação web moderna (Single-Page Application) concebida para recolher feedback de estudantes sobre práticas desportivas na região de Eindhoven.

O formulário está configurado para **utilizar o Google Sheets como base de dados em tempo real**. Sempre que um utilizador submete uma resposta, uma nova linha é automaticamente inserida na tua folha de cálculo com formatação e cabeçalhos automáticos.

---

## ⚡ Como ligar ao teu Google Sheets (Setup em 1 Minuto)

1. Abre o **Google Sheets** no teu browser ([sheets.new](https://sheets.new)) e cria uma nova folha (ex: `UniSport_Survey_Database`).
2. No menu superior do Google Sheets, clica em: **Extensões** (Extensions) > **Apps Script**.
3. Apaga qualquer código existente no editor e cola todo o código do ficheiro [`google_apps_script.js`](file:///Users/mgalamba/Documents/Education/Netherlands/FontysICT/Semester1/Challenge2_SportsCommunity/UniSport_ResearchSurvey/google_apps_script.js).
4. No canto superior direito do Apps Script, clica em **Implementar** (Deploy) > **Nova implementação** (New deployment).
5. Clica no ícone de engrenagem ⚙️ (Selecionar tipo) e escolhe: **Aplicação Web** (Web app).
6. Configura os seguintes campos:
   - **Descrição**: `UniSport Survey Webhook`
   - **Executar como**: `Eu` (o teu email Google)
   - **Quem tem acesso**: `Qualquer pessoa` (Anyone)  *(Importante para permitir submissões anónimas sem exigir login Google aos alunos)*
7. Clica em **Implementar** (Deploy) e concede as permissões na tua conta Google.
8. Copia o **URL da aplicação Web** gerado (ex: `https://script.google.com/macros/s/AKfycb.../exec`).
9. No teu website UniSport:
   - Clica no botão **Google Sheets Setup** no cabeçalho superior, cola o teu URL e clica em **Save**!
   - *(Ou em alternativa, podes colar o URL na variável `GOOGLE_SHEET_WEBAPP_URL` no ficheiro `index.html`)*.

Pronto! Cada submissão será gravada instantaneamente no teu Google Sheets.

---

## 🗂️ Estrutura das Colunas na Google Sheets Database

| Coluna | Campo | Tipo | Descrição |
| :--- | :--- | :--- | :--- |
| **A** | `Response ID` | String | Identificador único da resposta (ex: `#UNISPORT-4912`) |
| **B** | `Timestamp` | DateTime | Data e hora da submissão |
| **C** | `Student Status` | String | Estatuto de estudante em Eindhoven (Yes/No) |
| **D** | `Sports Frequency` | String | Frequência semanal de desporto |
| **E** | `Favorite Sports` | List | Lista de desportos favoritos separados por vírgula |
| **F** | `Skipped Due To Company` | String | Frequência com que faltou a treinos por falta de companhia |
| **G** | `Obstacles` | List | Principais obstáculos na organização de desporto estudantil |
| **H** | `Rating Quick Creation` | Number (1-5) | Avaliação da funcionalidade de criação rápida (<30s) |
| **I** | `Rating Geo Feed` | Number (1-5) | Avaliação do feed geográfico e filtro por desporto |
| **J** | `Extra Features Feedback` | Text | Sugestões abertas e ideias dos estudantes |

---

## 🚀 Como Executar o Formulário Localmente

Podes abrir diretamente o ficheiro `index.html` no teu browser:
```bash
open UniSport_ResearchSurvey/index.html
```

Ou iniciar um servidor web local rápido:
```bash
npx serve UniSport_ResearchSurvey
# ou
python3 -m http.server 8000 --directory UniSport_ResearchSurvey
```

---

## 📁 Estrutura de Ficheiros

```
UniSport_ResearchSurvey/
├── index.html               # Aplicação web moderna com ligação ao Google Sheets
├── google_apps_script.js    # Código Apps Script para colar no Google Sheets
├── schema.sql               # Schema SQL alternativo (caso também queiras usar MySQL/HeidiSQL)
├── README.md                # Instruções e documentação do projeto
└── assets/
    ├── logoUniSport.png     # Logótipo UniSport
    └── lettersUniSport.png  # Tipografia UniSport
```
