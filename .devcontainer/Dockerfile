FROM oven/bun:1 AS base
WORKDIR /workspace

# install tools for development
RUN apt update && apt -y install git zsh zsh-autosuggestions zsh-syntax-highlighting

# install oh-my-zsh manually for better Docker compatibility
RUN git clone https://github.com/ohmyzsh/ohmyzsh.git ~/.oh-my-zsh \
    && cp ~/.oh-my-zsh/templates/zshrc.zsh-template ~/.zshrc \
    && git clone https://github.com/zsh-users/zsh-autosuggestions.git ~/.oh-my-zsh/custom/plugins/zsh-autosuggestions \
    && git clone https://github.com/zsh-users/zsh-syntax-highlighting.git ~/.oh-my-zsh/custom/plugins/zsh-syntax-highlighting \
    && git clone https://github.com/zdharma-continuum/fast-syntax-highlighting.git ~/.oh-my-zsh/custom/plugins/fast-syntax-highlighting \
    && git clone --depth 1 https://github.com/marlonrichert/zsh-autocomplete.git ~/.oh-my-zsh/custom/plugins/zsh-autocomplete \
    && sed -i 's/plugins=(git)/plugins=(bun docker git zsh-autosuggestions zsh-syntax-highlighting fast-syntax-highlighting zsh-autocomplete)/' ~/.zshrc

# set zsh as default shell
ENV SHELL=/bin/zsh
SHELL ["/bin/zsh", "-c"]

FROM base AS dev

# copy and preinstall project dependencies
COPY package.json bun.lock* ./
RUN bun install --frozen-lockfile

COPY . .

EXPOSE 3000 4983
