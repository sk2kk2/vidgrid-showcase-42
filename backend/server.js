
const express = require('express');
const multer = require('multer');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Habilitar CORS para permitir requisições do frontend
app.use(cors());
app.use(express.json());

// Criar diretório para vídeos se não existir
const videosDir = path.join(__dirname, 'videos');
if (!fs.existsSync(videosDir)) {
  fs.mkdirSync(videosDir, { recursive: true });
}

// Configurar multer para upload de arquivos
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, videosDir);
  },
  filename: (req, file, cb) => {
    // Encontrar o próximo número disponível
    let counter = 1;
    let filename = `video${counter}.mp4`;
    
    while (fs.existsSync(path.join(videosDir, filename))) {
      counter++;
      filename = `video${counter}.mp4`;
    }
    
    cb(null, filename);
  }
});

const upload = multer({ 
  storage,
  limits: {
    fileSize: 100 * 1024 * 1024 // Limite de 100MB
  },
  fileFilter: (req, file, cb) => {
    // Aceitar apenas arquivos .mp4
    if (file.mimetype === 'video/mp4' || path.extname(file.originalname).toLowerCase() === '.mp4') {
      cb(null, true);
    } else {
      cb(new Error('Apenas arquivos .mp4 são permitidos!'), false);
    }
  }
});

// Servir arquivos estáticos (vídeos e XMLs)
app.use('/videos', express.static(videosDir));
app.use('/xml', express.static(videosDir)); // Para servir os arquivos XML também

// Rota de upload
app.post('/upload', upload.single('video'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Nenhum arquivo foi enviado' });
    }

    const videoUrl = `http://localhost:${PORT}/videos/${req.file.filename}`;
    
    // Extrair prazo de validade do body da requisição
    const { prazoValidade } = req.body;
    
    // Gerar arquivo XML com metadados
    const xmlContent = generateVideoXML(req.file.filename, prazoValidade);
    const xmlFilename = req.file.filename.replace('.mp4', '.xml');
    const xmlPath = path.join(videosDir, xmlFilename);
    
    // Salvar arquivo XML
    fs.writeFileSync(xmlPath, xmlContent, 'utf8');
    
    console.log(`Vídeo salvo como: ${req.file.filename}`);
    console.log(`XML gerado: ${xmlFilename}`);
    console.log(`URL: ${videoUrl}`);
    
    res.json({
      success: true,
      videoUrl,
      filename: req.file.filename,
      originalName: req.file.originalname,
      size: req.file.size,
      xmlFile: xmlFilename,
      prazoValidade
    });
  } catch (error) {
    console.error('Erro no upload:', error);
    res.status(500).json({ error: 'Erro ao fazer upload do vídeo' });
  }
});

// Função para gerar conteúdo XML
function generateVideoXML(filename, prazoValidade) {
  const dataEnvio = new Date().toISOString();
  
  // Se prazoValidade não foi fornecido, definir padrão de 30 dias
  let prazoValidadeFormatado;
  if (prazoValidade) {
    // Se for um número (dias), calcular a data
    if (!isNaN(prazoValidade)) {
      const dataLimite = new Date();
      dataLimite.setDate(dataLimite.getDate() + parseInt(prazoValidade));
      prazoValidadeFormatado = dataLimite.toISOString().split('T')[0];
    } else {
      // Se for uma data, usar como está
      prazoValidadeFormatado = prazoValidade;
    }
  } else {
    // Padrão: 30 dias a partir de hoje
    const dataLimite = new Date();
    dataLimite.setDate(dataLimite.getDate() + 30);
    prazoValidadeFormatado = dataLimite.toISOString().split('T')[0];
  }

  return `<?xml version="1.0" encoding="UTF-8"?>
<video>
  <nome>${filename}</nome>
  <dataEnvio>${dataEnvio}</dataEnvio>
  <prazoValidade>${prazoValidadeFormatado}</prazoValidade>
</video>`;
}

// Rota para verificar status do servidor
app.get('/status', (req, res) => {
  try {
    res.json({
      success: true,
      status: 'online',
      server: 'Video Server',
      uptime: process.uptime(),
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Erro ao verificar status:', error);
    res.status(500).json({ error: 'Erro ao verificar status do servidor' });
  }
});

// Rota para verificar se existem vídeos
app.get('/check', (req, res) => {
  try {
    const videos = [];
    
    // Verificar todos os arquivos de vídeo possíveis
    for (let i = 1; i <= 100; i++) {
      const filename = `video${i}.mp4`;
      const videoPath = path.join(videosDir, filename);
      
      if (fs.existsSync(videoPath)) {
        const stats = fs.statSync(videoPath);
        videos.push({
          filename,
          url: `http://localhost:${PORT}/videos/${filename}`,
          downloadUrl: `http://localhost:${PORT}/download/${filename}`,
          size: stats.size,
          created: stats.birthtime
        });
      }
    }
    
    res.json({
      success: true,
      exists: videos.length > 0,
      videos,
      count: videos.length
    });
  } catch (error) {
    console.error('Erro ao verificar vídeos:', error);
    res.status(500).json({ error: 'Erro ao verificar vídeos' });
  }
});

// Rota para deletar vídeo específico
app.delete('/delete/:filename', (req, res) => {
  try {
    const { filename } = req.params;
    
    // Validar o formato do filename
    if (!filename.match(/^video\d+\.mp4$/)) {
      return res.status(400).json({ error: 'Nome de arquivo inválido' });
    }
    
    const videoPath = path.join(videosDir, filename);
    
    // Verificar se o arquivo existe
    if (!fs.existsSync(videoPath)) {
      return res.status(404).json({ error: 'Vídeo não encontrado' });
    }
    
    // Deletar o arquivo
    fs.unlinkSync(videoPath);
    
    // Deletar o arquivo XML correspondente se existir
    const xmlFilename = filename.replace('.mp4', '.xml');
    const xmlPath = path.join(videosDir, xmlFilename);
    if (fs.existsSync(xmlPath)) {
      fs.unlinkSync(xmlPath);
      console.log(`XML deletado: ${xmlFilename}`);
    }
    
    console.log(`Vídeo deletado: ${filename}`);
    
    res.json({
      success: true,
      message: 'Vídeo deletado com sucesso',
      filename
    });
  } catch (error) {
    console.error('Erro ao deletar:', error);
    res.status(500).json({ error: 'Erro ao deletar o vídeo' });
  }
});

// Rota para download do vídeo específico
app.get('/download/:filename', (req, res) => {
  try {
    const { filename } = req.params;
    
    // Validar o formato do filename
    if (!filename.match(/^video\d+\.mp4$/)) {
      return res.status(400).json({ error: 'Nome de arquivo inválido' });
    }
    
    const videoPath = path.join(videosDir, filename);
    
    // Verificar se o arquivo existe
    if (!fs.existsSync(videoPath)) {
      return res.status(404).json({ error: 'Vídeo não encontrado' });
    }
    
    // Configurar cabeçalhos para download
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Type', 'video/mp4');
    
    // Enviar o arquivo
    res.sendFile(videoPath);
  } catch (error) {
    console.error('Erro no download:', error);
    res.status(500).json({ error: 'Erro ao fazer download do vídeo' });
  }
});

// Rota para listar todos os vídeos
app.get('/list', (req, res) => {
  try {
    const videos = [];
    
    // Verificar todos os arquivos de vídeo possíveis
    for (let i = 1; i <= 100; i++) {
      const filename = `video${i}.mp4`;
      const videoPath = path.join(videosDir, filename);
      
      if (fs.existsSync(videoPath)) {
        const stats = fs.statSync(videoPath);
        const xmlFilename = filename.replace('.mp4', '.xml');
        const xmlPath = path.join(videosDir, xmlFilename);
        
        videos.push({
          filename,
          url: `http://localhost:${PORT}/videos/${filename}`,
          downloadUrl: `http://localhost:${PORT}/download/${filename}`,
          xmlFile: xmlFilename,
          xmlUrl: fs.existsSync(xmlPath) ? `http://localhost:${PORT}/xml/${xmlFilename}` : null,
          size: stats.size,
          created: stats.birthtime
        });
      }
    }
    
    res.json({
      success: true,
      videos,
      count: videos.length,
      exists: videos.length > 0
    });
  } catch (error) {
    console.error('Erro ao listar vídeos:', error);
    res.status(500).json({ error: 'Erro ao listar vídeos' });
  }
});

// Rota para download de XML específico
app.get('/download/xml/:filename', (req, res) => {
  try {
    const { filename } = req.params;
    
    // Validar o formato do filename
    if (!filename.match(/^video\d+\.xml$/)) {
      return res.status(400).json({ error: 'Nome de arquivo XML inválido' });
    }
    
    const xmlPath = path.join(videosDir, filename);
    
    // Verificar se o arquivo existe
    if (!fs.existsSync(xmlPath)) {
      return res.status(404).json({ error: 'Arquivo XML não encontrado' });
    }
    
    // Configurar cabeçalhos para download
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Type', 'application/xml');
    
    // Enviar o arquivo
    res.sendFile(xmlPath);
  } catch (error) {
    console.error('Erro no download do XML:', error);
    res.status(500).json({ error: 'Erro ao fazer download do XML' });
  }
});

// Rota para atualizar prazo de validade do vídeo (atualiza XML)
app.post('/update-validity', (req, res) => {
  try {
    const { filename, expirationDays } = req.body || {};

    // Validações básicas
    if (!filename || !filename.match(/^video\d+\.mp4$/)) {
      return res.status(400).json({ error: 'Nome de arquivo inválido. Use o padrão videoX.mp4' });
    }

    const days = parseInt(expirationDays, 10);
    if (!Number.isFinite(days) || days <= 0) {
      return res.status(400).json({ error: 'expirationDays deve ser um número positivo' });
    }

    const xmlFilename = filename.replace('.mp4', '.xml');
    const xmlPath = path.join(videosDir, xmlFilename);

    // Calcula nova data de validade a partir de hoje
    const dataLimite = new Date();
    dataLimite.setDate(dataLimite.getDate() + days);
    const novoPrazo = dataLimite.toISOString().split('T')[0];

    let novoConteudoXML = '';

    if (fs.existsSync(xmlPath)) {
      const atual = fs.readFileSync(xmlPath, 'utf8');
      if (atual.includes('<prazoValidade>')) {
        // Substitui apenas o valor de <prazoValidade>
        novoConteudoXML = atual.replace(/<prazoValidade>.*<\/prazoValidade>/s, `<prazoValidade>${novoPrazo}</prazoValidade>`);
      } else {
        // Insere a tag antes do fechamento
        novoConteudoXML = atual.replace('</video>', `  <prazoValidade>${novoPrazo}</prazoValidade>\n</video>`);
      }
    } else {
      // Se não existir XML, cria um novo mantendo o padrão
      novoConteudoXML = generateVideoXML(filename, days);
    }

    fs.writeFileSync(xmlPath, novoConteudoXML, 'utf8');

    return res.json({
      success: true,
      filename,
      xmlFile: xmlFilename,
      prazoValidade: novoPrazo,
      xmlUrl: `http://localhost:${PORT}/xml/${xmlFilename}`
    });
  } catch (error) {
    console.error('Erro ao atualizar validade:', error);
    return res.status(500).json({ error: 'Erro ao atualizar validade do vídeo' });
  }
});

// Rota de teste
app.get('/', (req, res) => {
  res.json({
    message: 'Servidor de vídeos rodando!',
    endpoints: {
      upload: 'POST /upload (apenas .mp4)',
      check: 'GET /check',
      status: 'GET /status',
      delete: 'DELETE /delete/:filename',
      download: 'GET /download/:filename',
      list: 'GET /list',
      videos: 'GET /videos/:filename',
      updateValidity: 'POST /update-validity',
    },
    port: PORT,
    note: 'Vídeos são salvos como video1.mp4, video2.mp4, etc.'
  });
});

app.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════╗
║   Servidor de Vídeos Iniciado!         ║
║   Porta: ${PORT}                          ║
║   URL: http://localhost:${PORT}           ║
║   Diretório de vídeos: ./videos        ║
║   Arquivo: video.mp4 (apenas .mp4)     ║
╚════════════════════════════════════════╝
  `);
});
