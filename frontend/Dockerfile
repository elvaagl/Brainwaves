FROM nginx:alpine

COPY src/ /usr/share/nginx/html/
COPY public/ /usr/share/nginx/html/public/
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
