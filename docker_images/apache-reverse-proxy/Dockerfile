FROM php:7.2-apache

COPY conf/ /etc/apache2

COPY template /var/apache2/template/
COPY apache2-foreground /usr/local/bin/

RUN a2enmod proxy proxy_http
RUN a2ensite 000-* 001-*