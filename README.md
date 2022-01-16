# Aide-mémoire

## Docker

Build une image en lui donnant un nom

    docker build -t nameImage .

Run un container en mappant le port 80 sur le port de sortie 8080 et en donnant un nom au container

    docker run -p 8080:80 --name nameContainer nameImage

Trouver l'adresse ip d'un container

    docker inspect nameContainer | grep -i ipaddr


## Git

Création d'une nouvelle branche

    git checkout -b newBranch

Nom des branches utilisées dans ce projet

    main
    fb-apache-static
    fb-express-dynamic
    fb-apache-reverse-proxy
    fb-ajax-jquery
    fb-dynamic-configuration
    
    
# Pré-avis

Nous avons décidé de faire un repo chacune pour être sûre de bien comprendre la matière de ce cours. Ce repo est celui de Maëlle Vogel. Celui de Mélissa Gehring est visible à l'adresse: [https://github.com/Lollipoke/API-2021-HTTP-Infrastructure](https://github.com/Lollipoke/API-2021-HTTP-Infrastructure)
   

# Partie 1 apache web static

Pour cette première partie il était nécessaire de créer un site web static. Nous avons utilisé un template de bootstrap pour avoir une interface user-friendly.
Nous voulions ensuite que le site soit accesible en localhost pour cela nous nous sommes aidé de Docker qui fournit une image php avec apache intégré.
En lisant la documentaton nous apercevons qu'il faut placer notre site dans le dossier /var/www/html de l'image. La ligne COPY du Dockerfile s'en occupe.

    FROM php:7.2-apache

    COPY src/ /var/www/html/

Finalement il faut build puis run le container pour voir notre site à l'adresse [http://localhost:8080](http://localhost:8080)

    docker build -t api-static .
    docker run -p 8080:80 -d --name api-static api-static

# Partie 2 express web dynamic

Pour cette deuxième partie nous avons besoin d'un image node pour faire fonctionner un script Javascript. La documentation demande de placer le script dans 
le dossier /opt/app ce que fait la COPY du Dockerfile une fois encore. La ligne CMD permet d'exécuter le script.

    FROM node:16.13
    COPY src/ /opt/app
    CMD ["node", "/opt/app/index.js"]

Notre script génére un liste d'animaux colorés à adopter. La couleur pourrait être récupéré pour être affiché mais par manque de temps nous n'avons pas pû le faire.
La liste est renouvelé à chaque rafraîchissement de page.

Finalement il faut build puis run le container pour voir notre site à l'adresse [http://localhost:9090](http://localhost:9090)

    docker build -t api-dynamic .
    docker run -p 9090:3000 -d --name api-dynamic api-dynamic

# Partie 3 reverse proxy

Pour cette partie nous allons réutilisé les containers créés dans les deux premières partie. Pour commencer il faut trouver l'adresse ip de chacun avec
la commande donné dans le webcast:

    docker inspect nameContainer | grep -i ipaddr

Pour notre infrastructure nous avons trouvé les adresses:

ip pour le container php-web-static: 172.17.0.2

ip pour le container js-web-dynamic: 172.17.0.3

La config pour les sites sont diponible dans le fichier conf/sites-available/001-reverse-proxy.conf. Le site statique est à la racine du site et le site dynamique avec le flux json est à l'adresse /api/students/.

Nous utilisé la même image de base que pour la partie 1 mais nous mettons les fichiers dans le dossier d'Apache. Nous activons deux plugins puis nous activons notre site.

    FROM php:7.2-apache

    COPY conf/ /etc/apache2

    RUN a2enmod proxy proxy_http
    RUN a2ensite 000-* 001-*

Sous Debian 11 il faut utiliser localhost pour mapper le domaine dans le fichier /etc/hosts. Nous avons utilisé demo.api.ch pour le nom de domaine.

    127.0.0.1 demo.api.ch

Une fois que le reverse proxy est configuré il n'y a plus besoin de mapper les ports car apache s'occupe de le rediriger en sortant du docker.

    docker run -d --name api-static api-static
    docker run -d --name api-dynamic api-dynamic

    docker build -t api-rp .
    docker run -p 8080:80 -d --name api-rp api-rp

Maintenant les deux sites sont visibles à l'adresse [http://demo.api.ch:8080](http://demo.api.ch:8080) et [http://demo.api.ch:8080/pets/](http://demo.api.ch:8080/pets/)

# Partie 4 ajax

Dans cette partie nous allons rajouté un script qui fera des requêtes pour afficher sur la page web statique les animaux colorés à adopter.
Ce script prend le premier animal du flux JSON (du site dynamique réalisé à la partie 2) pour l'afficher dans une balise span html avec le nom de class pets. Le nom de l'animal est affiché dans sa couleur. Il renouvelle cet animal toutes les 2 secondes.
Le nom du script doit être placé en bas de la page html index.html dans des balises script.

    <script src="student.js"></script>


# Partie 5 configuration dynamique du reverse proxy

Cette partie permet plus de flexibilté car l'adresse ip des deux containers est mis au moment de lancer le reverse proxy et non plus dans des fichiers de configuration.

Nous utilisons -e pour mettre des arguments qui sont des valeurs de variables que le script php récupére pour mettre dans le fichier de configuration.

Le script apache2-foreground se lance au démarrage du container. C'est lui qui met le résulat du script php dans le fichie de configuration du reverse proxy. Après cela il faut relancer apache2 pour prendre en compte les modifications. Nous nous sommes basé sur le fichier pour notre version de php car celui de la vidéo n'est plus d'actualité.
Lien du fichier pour notre version php: [php:7.2/apache2-foreground](https://github.com/docker-library/php/blob/fbba7966bc4ca30a8bb2482cd694a798a50f4406/7.2/buster/apache/apache2-foreground)

Finalement on construit l'image puis on lance le container et les deux sites sont visibles à l'adresse [http://demo.api.ch:8080](http://demo.api.ch:8080) et [http://demo.api.ch:8080/pets/](http://demo.api.ch:8080/pets/)

    docker build -t api-rp .
    docker run -d -e STATIC_APP=172.17.0.2:80 -e DYNAMIC_APP=172.17.0.3:3000 --name apache-rp -p 8080:80 api-rp

# Partie 6 étapes additionelles

Nous avons mis en place du load-balancing et des sticky sessions à l'aide de docker-compose et traefik

## docker-compose

Docker compose permet de décrire le fonctionnement de plusieurs services faisant partie du même projet. Un fichier docker-compose.yml à la racine du projet décrit les fonctionnement des différent services.

## traefik

Nous avons pris une image Traefik pour replacer le reverse porxy réalisé à l'étape précèdente. Cela facilite le travail car traefik s'occupe de trouver les adresses des containers et les déploye selon les informations données dans la partie labels.

Cette ligne permet de donner l'adresse du site et oũ il doit être placé. Ici se sera à l'adresse [http://demo.api.ch:8080](http://demo.api.ch:8080). Le port est spécificé dans le service reverse-proxy.

    - "traefik.http.routers.apache_static.rule=Host(`demo.api.ch`) && PathPrefix(`/`)"

Pour le site dynamique il a fallu préciser sur quel port le script écoute.

    - "traefik.http.services.express_dynamic.loadbalancer.server.port=3000"

Le loadbalancing se fait avec cette ligne.

    - "traefik.http.services.apache_static.loadbalancer.sticky=true"

