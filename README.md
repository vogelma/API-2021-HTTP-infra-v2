# Aide-mémoire

docker build -t name .

docker run -p 8080:80 --name name image

docker inspect name | grep -i ipaddr


git checkout -b name

fb-dynamic-configuration
fb-ajax-jquery
fb-apache-reverse-proxy
fb-apache-static
fb-express-dynamic

# Partie 1 apache web static



    docker build -t api-static .
    docker run -p 8080:80 -d --name api-static api-static

# Partie 2 express web dynamic

    docker build -t api-dynamic .
    docker run -p 9090:3000 -d --name api-dynamic api-dynamic

# Partie 3 reverse proxy

ip pour le container php-web-static: 172.17.0.3

ip pour le container js-web-dynamic: 172.17.0.2

La config pour les sites sont diponible dans le fichier conf/sites-available/001-reverse-proxy.conf. Le site statique est à la racine du site et le site dynamique avec le flux json est à l'adresse /api/students/


    FROM php:7.2-apache

    COPY conf/ /etc/apache2

    RUN a2enmod proxy proxy_http
    RUN a2ensite 000-* 001-*

Sous Debian 11 il faut utiliser localhost pour mapper le domaine. Nous avons utilisé demo.api.ch pour le nom de domaine.

    127.0.0.1 demo.api.ch


Une fois que le reverse proxy est configuré il n'y a plus besoin de mapper les ports car apache s'occupe de le rediriger en sortant du docker.

    docker run -d --name api-static api-static
    docker run -d --name api-dynamic api-dynamic

    docker rm api-rp
    docker run -p 8080:80 -d --name api-rp api-rp


# Partie 5 configuration dynamique du reverse proxy



Utiliser -e pour mettre des arguments plus précisement des valeurs de variables.

    docker run -e STATIC_APP = 172.17.0.3 -e DYNAMIC_APP=172.17.0.2 --name apache-rp -p 8080:80 api-rp
