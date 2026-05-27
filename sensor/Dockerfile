FROM ubuntu:22.04
RUN apt-get update && apt-get install -y \
    g++ \
    && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY src/sensor.cpp .
# -pthread necesario para std::thread y std::mutex
RUN g++ -o sensor sensor.cpp -pthread
CMD ["./sensor"]
