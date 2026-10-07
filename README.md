# G1 News Scraper & Validator

Sistema completo (Full Stack) para captura automatizada, extração semântica profunda e auditoria comparativa lado a lado das notícias mais recentes do portal G1 (Globo).

---

## 🚀 Funcionalidades

1. **Descoberta Dinâmica de Pautas:**
   - Consumo em tempo real do feed RSS oficial da Globo (`https://g1.globo.com/rss/g1/{editoria}/`).
   - Fallback de contingência para extração via HTML da home da categoria.
   - Filtro inteligente que descarta transmissões ao vivo sem artigo estruturado, links de vídeos isolados, publicidades e páginas institucionais.
   - Limite estrito configurável: primeiras **5 matérias mais recentes**.

2. **Extração Semântica Profunda (Deep Scraping com Cheerio):**
   - **Título:** `h1.content-head__title` com fallback para `[itemprop="headline"]`.
   - **Subtítulo (Linha-fina):** `h2.content-head__subtitle` com fallback para `[itemprop="alternativeHeadline"]`.
   - **Data de Publicação:** `meta[itemprop="datePublished"]` ou `time[itemprop="datePublished"]`.
   - **Data de Modificação:** `meta[itemprop="dateModified"]` ou `time[itemprop="dateModified"]`.
   - **URL Canônica:** `link[rel="canonical"]` com fallback para URL da requisição.
   - **Imagem de Destaque:** `meta[property="og:image"]` / `meta[itemprop="image"]`.
   - **Corpo da Notícia:** `article[itemprop="articleBody"]` mantendo parágrafos (`p.content-text__container`) e subtítulos intermediários (`div.content-intertitle h2`).

3. **Saneamento e Limpeza de Ruído (Content Sanitization):**
   - Eliminação automática de links recomendados (`LEIA TAMBÉM:`, `VEJA MAIS:`).
   - Bloqueio de chamadas promocionais de canais (ex.: *"Clique aqui para seguir o canal do g1 no WhatsApp"*).
   - Remoção de anúncios intermediários (`.content-ads`, `glb-ad`), widgets de podcasts e enquetes.

4. **Painel de Comparação e Auditoria Visual:**
   - Visualização em duas colunas:
     - **Lado Esquerdo:** Dados limpos extraídos (visualização editorial formatada, JSON estruturado ou Markdown).
     - **Lado Direito:** Fonte original da notícia e **Checklist Interativo de Auditoria**:
       - [x] Título corresponde exatamente ao original?
       - [x] Linha-fina (subtítulo) capturada sem ruídos?
       - [x] Data de publicação reflete a matéria mais recente do feed?
       - [x] Todos os parágrafos capturados sem quebras indevidas?
       - [x] Anúncios e links de canais (WhatsApp) filtrados com sucesso?
       - [x] Imagem de destaque em alta resolução carregada?

5. **Armazenamento e Exportação:**
   - Memória in-memory e persistência local em `data/articles.json`.
   - Exportação em um clique do dataset em JSON para consumo externo.

---

## 🛠️ Tecnologias Utilizadas

- **Runtime:** Node.js (ES Modules)
- **Servidor:** Express.js
- **Scraper / Parser:** Cheerio
- **Cliente HTTP:** Axios (com cabeçalhos customizados de desktop)
- **Frontend:** React 19 + TypeScript + Vite + Tailwind CSS
- **Ícones:** Lucide React

---

## 📡 Endpoints da API REST

### `GET /api/scrape?editoria={editoria}`
Dispara a descoberta e extração das 5 matérias mais recentes da editoria informada (`geral`, `politica`, `economia`, `tecnologia`, `carros`, `ciencia-e-saude`, `mundo`).
Persiste em `data/articles.json` e retorna o array com os 5 objetos estruturados.

### `GET /api/articles`
Retorna o último conjunto de notícias extraído armazenado em cache/arquivo.

### `POST /api/scrape-url`
Permite enviar uma URL avulsa de qualquer matéria do G1 no corpo `{ "url": "..." }` para extração e auditoria imediata.

### `GET /api/editorias`
Lista as editorias suportadas e suas descrições.

---

## 💻 Execução Local

```bash
# Instalar dependências
npm install

# Iniciar servidor integrado (API Express + Vite na porta 3000)
npm run dev

# Compilar para produção
npm run build
npm start
```
