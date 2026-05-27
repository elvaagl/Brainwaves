FROM eclipse-temurin:17-jdk

RUN apt-get update && apt-get install -y \
    openssh-server \
    && rm -rf /var/lib/apt/lists/*

RUN mkdir /var/run/sshd

RUN useradd -m -s /bin/bash brainuser && \
    echo "brainuser:brainwaves2024" | chpasswd

RUN sed -i 's/#PasswordAuthentication yes/PasswordAuthentication yes/' /etc/ssh/sshd_config && \
    sed -i 's/PasswordAuthentication no/PasswordAuthentication yes/' /etc/ssh/sshd_config

EXPOSE 22
EXPOSE 8080
EXPOSE 8081

WORKDIR /app

COPY src/*.java .
COPY lib/mariadb-connector.jar .

RUN javac -cp mariadb-connector.jar *.java

COPY start.sh /start.sh
RUN chmod +x /start.sh

CMD ["/start.sh"]