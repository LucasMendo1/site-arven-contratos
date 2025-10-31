# Dockerfile - Sistema ARVEN
FROM node:18-alpine

# Criar diretório da aplicação
WORKDIR /app

# Copiar package.json e package-lock.json
COPY package*.json ./

# Instalar dependências
RUN npm ci --only=production

# Copiar código fonte
COPY . .

# Build do frontend
RUN npm run build

# Expor porta
EXPOSE 5000

# Variáveis de ambiente padrão (sobrescrever no docker-compose.yml)
ENV NODE_ENV=production
ENV PORT=5000

# Comando para iniciar
CMD ["npm", "start"]
