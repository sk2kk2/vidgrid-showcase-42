# Configuração Android TV

## Como usar o Monitor em Android TV

### 1. Preparando o Backend
```bash
cd backend
npm install
node server.js
```
O servidor rodará em `http://localhost:3000`

### 2. Descobrindo o IP da máquina
No Windows:
```cmd
ipconfig
```

No Linux/Mac:
```bash
ifconfig
```

Anote o IP local (ex: `192.168.1.100`)

### 3. Testando o Backend
Abra no navegador: `http://192.168.1.100:3000`
Deve mostrar as informações do servidor.

### 4. Abrindo o Monitor na Android TV

#### Opção 1: Via Query String (Recomendado)
```
https://SEU_DOMINIO.lovable.app/monitor?server=http://192.168.1.100:3000
```

#### Opção 2: Via HTTP (mesma rede)
Se tiver problemas com Mixed Content (HTTPS → HTTP), use:
```
http://192.168.1.100:5173/monitor?server=http://192.168.1.100:3000
```

### 5. Primeira Configuração
Se não usar query string, o monitor mostrará uma tela de configuração onde você pode:
1. Inserir o endereço do servidor
2. Testar a conexão
3. Salvar para próximas sessões

### Recursos para Android TV

✅ **Autoplay automático** - Vídeos começam automaticamente  
✅ **Controles via controle remoto** - Navegação por D-pad  
✅ **Sem intervenção manual** - Funciona após configuração inicial  
✅ **Loop inteligente** - Um vídeo = loop, múltiplos = sequência  
✅ **Recuperação de erros** - Tenta próximo vídeo em caso de erro  
✅ **Detecção Mixed Content** - Avisa sobre problemas HTTPS/HTTP  

### Controles Disponíveis
- **🔊** - Liga/desliga som
- **⏭️** - Próximo vídeo
- **⚙️** - Reconfigurar servidor

### Dicas para Android TV

1. **Use HTTP sempre que possível** - Evita problemas de Mixed Content
2. **Configure o IP fixo** - Para que não mude na rede
3. **Teste primeiro no PC** - Verifique se o backend responde
4. **Use a query string** - Mais rápido que configurar manualmente

### Troubleshooting

**Tela preta com "Erro ao conectar":**
- Verifique se o backend está rodando
- Confirme o IP correto da máquina
- Teste `http://IP:3000` no navegador

**Mixed Content bloqueado:**
- Use HTTP em vez de HTTPS
- Ou configure um proxy HTTPS para o backend

**Vídeos não tocam:**
- Android TV tem autoplay ativado por padrão
- Se necessário, toque na tela para iniciar

**Sem som:**
- Por padrão o vídeo inicia mudo (muted=true)
- Use o botão 🔊 ou remova `muted` do código