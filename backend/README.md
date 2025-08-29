# Backend - Servidor de Vídeos

## Instalação

1. Entre na pasta backend:
```bash
cd backend
```

2. Instale as dependências:
```bash
npm install
```

## Como rodar

### Servidor único (porta 3000):
```bash
npm start
```

### Múltiplos servidores (para simular diferentes televisores):

Terminal 1 - Servidor na porta 3000:
```bash
npm run server1
```

Terminal 2 - Servidor na porta 3001:
```bash
npm run server2
```

Terminal 3 - Servidor na porta 3002:
```bash
npm run server3
```

## Endpoints disponíveis

- **POST /upload** - Upload de vídeo
- **DELETE /delete/:filename** - Deletar vídeo
- **GET /list** - Listar todos os vídeos
- **GET /videos/:filename** - Acessar vídeo específico

## Estrutura de pastas

```
backend/
├── server.js       # Código do servidor
├── package.json    # Dependências
├── README.md       # Este arquivo
└── videos/         # Pasta onde os vídeos são salvos (criada automaticamente)
```

## Notas

- Os vídeos são salvos na pasta `videos/` dentro do diretório backend
- Limite de upload: 100MB por vídeo
- Aceita apenas arquivos de vídeo (mp4, webm, ogg, mov, avi)
- CORS habilitado para permitir requisições do frontend