# 🧱 Blocchi - Lego 3D Studio

Uma aplicação web moderna de montagem de blocos de Lego, desenvolvida em **React**, **Three.js** e **Tailwind CSS**, com integração ao padrão oficial **LDraw**.

![Texto Alternativo](
https://images.unsplash.com/photo-1716406756220-a1e40d06420d?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=NHwxMjA3fDA%3D
)


---

## ✨ Recursos Principais

### 🎨 Interface
- **Tema Dark Charcoal Profissional**: Painéis escuros, tipografia nítida, paleta de ferramentas vertical e abas de workspace (*Montagem*, *Modelagem*, *Cores LDraw*, *Inspetor*).
- **Gizmo 3D de Orientação**: Indicador circular interativo dos eixos X, Y e Z no canto superior direito com vistas rápidas (*Top*, *Front*, *Right*).
- **Modos de Shading**: Alternância instantânea entre *Wireframe*, *Sólido (Clay)*, *Material Preview* e *Renderizado*.

### 🧊 Viewport 3D & Motor Físico (Three.js)
- **Mesa de Montagem & Grid Duplo**: Grid com subdivisões proporcionais aos pinos (studs) do Lego e eixos principais coloridos (X = Vermelho, Z = Azul).
- **Iluminação de Estúdio & Sombras Suaves**: Iluminação física composta por Key Light com projeção de sombras PCF, Fill Light azulado e Rim Light traseira para realce dos chanfros plásticos ABS.
- **Modelagem Realista da Base**:
  - Cavidade oca inferior com espessura de parede real de injeção (`3.2 LDU`).
  - **Tubos inferiores de conexão ocos** (*anti-stud tubes*) para blocos 2xN (como o bloco 2x4 e 2x2).
  - Pinos centrais para peças lineares 1xN.

### 🧲 Snapping & Manipulação 3D Direta
- **Manipulador 3D Interativo (`TransformControls`)**: Setas 3D nos eixos X, Y e Z diretamente sobre a peça selecionada no canvas para translação e anéis para rotação.
- **Encaixe Inteligente (Snap to Studs)**: Ao pressionar **`S`** ou o botão de ímã, a peça analisa o volume abaixo e se conecta perfeitamente aos pinos das peças inferiores ou assenta na mesa.
- **Inserção sem Colisão**: Ao adicionar uma peça com outra selecionada, ela é montada diretamente no topo dos pinos correspondentes.
- **Navegação Segura**: A seleção das peças é mantida de forma estável enquanto você orbita, move ou dá zoom na viewport.

### 📐 Integração LDraw
- **Catálogo de Peças**: Peças essenciais (Brick 2x4 `#3001`, Brick 2x2 `#3003`, Brick 1x2 `#3004`, Plates, Tiles e Baseplates).
- **Paleta de Cores Oficiais LDraw**: Cores sólidas, transparentes e metálicas com códigos oficiais LDraw (ex: Red `#4`, Blue `#1`, Yellow `#14`, Black `#0`, etc.).
- **Exportação `.ldr`**: Geração e download de arquivos `.ldr` 100% compatíveis com softwares como **BrickLink Studio**, **LDView** e **LDCad**.

---

## ⌨️ Atalhos de Teclado (Blender-Style)

| Tecla | Ação |
|---|---|
| **`G`** | Ativar Manipulador de Translação 3D (Mover eixos X, Y, Z) |
| **`R`** | Ativar Manipulador de Rotação 3D |
| **`Shift + R`** | Girar a peça selecionada em 90° no eixo Y |
| **`S`** | Encaixar / Conectar aos pinos inferiores ou mesa (*Snap*) |
| **`W`** | Modo de Seleção padrão |
| **`Delete` / `X`** | Deletar a peça selecionada |
| **`Shift + D`** | Duplicar a peça selecionada |
| **`Escape`** | Desselecionar peça ativa |
| **Botão Esquerdo** | Selecionar peça / Girar órbita da câmera |
| **Shift + Clique** | Mover mesa (*Pan*) |
| **Scroll do Mouse** | Zoom in / Zoom out |

---

## 🚀 Como Executar Localmente

### Pré-requisitos
- [Node.js](https://nodejs.org/) (versão 18 ou superior)
- `npm` ou `yarn`

### Instalação

1. Clone o repositório:
```bash
git clone https://github.com/SEU_USUARIO/blocchi.git
cd blocchi
```

2. Instale as dependências:
```bash
npm install
```

3. Inicie o servidor de desenvolvimento:
```bash
npm run dev
```

4. Abra no navegador:
```
http://localhost:5173/
```

### Build de Produção

```bash
npm run build
```

---

## 📂 Estrutura do Projeto

```
blocchi/
├── src/
│   ├── types/
│   │   └── lego.ts                # Definições de tipos TypeScript
│   ├── ldraw/
│   │   ├── colors.ts              # Paleta oficial de cores LDraw e diretivas !COLOUR
│   │   ├── partsData.ts           # Definições LDraw de peças e gerador MPD
│   │   ├── proceduralBricks.ts    # Geometria Three.js com cavidade e tubos inferiores
│   │   ├── ldrawLoaderHelper.ts   # Integração com LDrawLoader nativo
│   │   └── exportLDraw.ts         # Exportador oficial .ldr
│   ├── components/
│   │   ├── viewport/
│   │   │   ├── ViewportCanvas.tsx # Canvas 3D com OrbitControls e TransformControls
│   │   │   ├── ViewportGrid.ts    # Grid da mesa de montagem estilo Blender
│   │   │   ├── ViewportGizmo.tsx  # Gizmo 3D interativo de orientação
│   │   │   └── ViewportHeader.tsx # Barra superior do viewport e shading modes
│   │   └── ui/
│   │       ├── TopNavBar.tsx      # Barra de menu e ações principais
│   │       ├── LeftToolBar.tsx    # Barra vertical de ferramentas
│   │       ├── RightSidebar.tsx   # Painel lateral com abas
│   │       ├── PartsCatalog.tsx   # Catálogo pesquisável de peças
│   │       ├── ColorPalette.tsx   # Seletor de cores oficiais LDraw
│   │       ├── SceneInspector.tsx # Inspetor de propriedades e outliner
│   │       └── StatusBar.tsx      # Barra de status com atalhos e polígonos
│   ├── App.tsx                    # Orquestrador da aplicação
│   ├── main.tsx                   # Entrada da aplicação React
│   └── index.css                  # Tema dark e Tailwind CSS v4
├── package.json
├── vite.config.ts
└── tsconfig.json
```

---

## 🛠️ Tecnologias Utilizadas

- **React 19** + **TypeScript**
- **Vite** (Build tool ultrarrápida)
- **Three.js** (WebGL 3D engine com OrbitControls, TransformControls e LDrawLoader)
- **Tailwind CSS v4**
- **Lucide Icons**

---

## 📄 Licença

Este projeto é distribuído sob a licença MIT.
