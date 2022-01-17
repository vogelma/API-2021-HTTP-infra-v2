# Aide-mémoire

## Docker

Build une image en lui donnant le nom nameImage

    docker build -t nameImage .

Run un container en arrière plan, en mappant le port 80 du container sur le port 8080 de l'hôte, et en donnant le nom nameContainer au container

    docker run -d -p 8080:80 --name nameContainer nameImage

Trouver l'adresse ip du container nameContainer

    docker inspect nameContainer | grep -i ipaddr


## Git

Création d'une nouvelle branche newBranch

    git checkout -b newBranch

Nom des branches utilisées dans ce projet

    main
    fb-apache-static
    fb-express-dynamic
    fb-apache-reverse-proxy
    fb-ajax-jquery
    fb-dynamic-configuration
    fb-traefik
    
    
# Pré-avis

Nous avons décidé de faire un repo chacune et de travailler chacune sur le sien en parallèle pour être sûre de bien comprendre la matière de ce cours. Ce repo est celui de Maëlle Vogel. Celui de Mélissa Gehring est visible à l'adresse: [https://github.com/Lollipoke/API-2021-HTTP-Infrastructure](https://github.com/Lollipoke/API-2021-HTTP-Infrastructure). Nous avons décidé arbitrairement d'ajouter notre rapport sur ce repo-là (celui de Maëlle Vogel), et c'est également celui-là que nous soumettons pour la note.
   

# Architecture du repo

La branche main contient uniquement le fichier README.md, et nous avons ensuite créé une nouvelle branche pour chaque nouvelle partie. Chaque checkout a été fait à partir de la branche actuelle, et non pas à partir de la branche main, de sorte que la branche de la partie n+1 contient également le travail réalisé dans la partie n.
Les fichiers nécessaires aux 3 principales images sont séparés en 3 dossiers, stockés dans le dossier docker_images.


# Partie 1 : Serveur HTTP statique avec apache httpd (fb-apache-static)

Pour cette première partie il nous était demandé de créer un site web static. Pour le contenu de notre page web, nous avons utilisé un template de bootstrap pour avoir une interface user-friendly.
Afin de lancer un serveur HTTP générant notre page statique à partir du contenu de notre template, accessible en localhost, nous avons utilisé l'image docker officielle php avec apache intégré.
La documentation de l'image officielle php nous indique le contenu à insérer dans le Dockerfile :

    FROM php:7.2-apache

    COPY src/ /var/www/html/

Nous observons que le contenu du dossier src/ est copié à l'emplacement /var/www/html/, car c'est à cet endroit que se situe l'arborescence de notre file system HTML dans l'image Docker. Nous avons donc naturellement inséré notre template dans notre dossier src/ local qui se situe au même niveau que le Dockerfile, afin qu'il soit copié au bon endroit au moment de la création de l'image.

Finalement, nous pouvons build notre image :

    docker build -t api/api-static .

Puis run le container :

    docker run -p 8080:80 -d --name api-static api/api-static    

Pour voir notre site à l'adresse [http://localhost:8080](http://localhost:8080)

Note : en exécutant la commande /bin/bash sur notre container api-static en train de tourner, nous pouvons aller observer les fichiers de configuration du serveur apache. Ils se trouvent dans le dossier /etc/apache2/. On y trouve, entre autres, le fichier de configuration principal apache2.conf, ou encore la liste des fichiers de configuration pour plusieurs sites potentiels, situés dans le dossier sites-available. Cela nous sera utile pour les étapes ultérieures.


# Partie 2 : Serveur HTTP dynamique avec express.js (fb-express-dynamic)

Pour cette deuxième partie nous avons utilisé l'image Docker node.js officielle pour run un script Javascript. La documentation officielle nous indique quoi mettre dans le Dockerfile : 

    FROM node:16.13
    COPY src/ /opt/app
    CMD ["node", "/opt/app/index.js"]

A nouveau nous pouvons observer que le contenu du dossier local src/ est copié dans le dossier /opt/app de notre image. 

Nous avons exécuté dans notre dossier local src les commandes suivantes :

    npm init
    npm install --save chance
    npm install --save express
    
Afin d'obtenir les fichiers nécessaires au démarrage d'une nouvelle application node.js, ainsi que les modules Chance (pour la génération aléatoire d'animaux et de couleurs), et Express.js (pour la création d'une application HTTP)

Notre script index.js génère, à l'aide du module Chance, un liste d'animaux et de couleurs à adopter. La couleur pourra être récupérée dans les étapes ultérieures pour influencer la couleur du texte de l'animal. Nous avons également lancé une application HTTP à l'aide du framework Express.js qui se connecte au port 3000 et qui renvoie au client les paires d'animaux colorés générées.
La liste est renouvelée à chaque rafraîchissement de page.

La dernière ligne du Dockerfile, CMD, permet d'exécuter la commande node au lancement d'un container. Dans ce cas-ci, cela va exécuter le script 'index.js' situé dans le dossier /opt/app.
   
Finalement, nous pouvons build notre image :

    docker build -t api/api-dynamic .

Puis run le container :

    docker run -p 9090:3000 -d --name api-dynamic api/api-dynamic    

Pour voir notre site à l'adresse [http://localhost:9090](http://localhost:9090)

# Partie 3 : Reverse proxy avec apache, configuration statique (fb-apache-reverse-proxy)

Pour cette partie nous allons réutiliser les images créées dans les deux premières parties pour nos deux services, et ajouter un reverse proxy réalisé à l'aide d'un serveur apache afin de centraliser nos requêtes. 
Tout d'abord il nous faut relancer deux containers, un pour chacun de nos service, en prenant soin de ne PAS les mapper vers l'extérieur avec l'option -p. L'intérêt du reverse proxy est justement de gérer les requêtes vers les différents services en interne. 
Un fois nos containers lancés à l'aide de :

    docker run -d --name api-static api/api-static 
    docker run -d --name api-dynamic api/api-dynamic 
    
Nous avons pu trouver l'adresse ip de chacun avec la commande donnée dans le webcast:

    docker inspect nameContainer | grep -i ipaddr

Pour notre infrastructure nous avons trouvé les adresses:

    ip pour le container api-static: 172.17.0.2
    ip pour le container api-dynamic: 172.17.0.3

Maintenant que nous avons nos deux services, il nous faut configurer le reverse-proxy. Pour cela nous avons utilisé la même image Docker php avec apache que dans la partie 1, et nous avons remplacé dans le Dockerfile la copie du dossier src/ contenant le template de la page web statique par la copie du dossier conf/ qui contient les fichiers de configuration du reverse proxy. 

    FROM php:7.2-apache

    COPY conf/ /etc/apache2

    RUN a2enmod proxy proxy_http
    RUN a2ensite 000-* 001-*

Comme mentionné dans la partie 1, ces fichiers de configuration se trouvent dans l'image dans le dossier /etc/apache2. 

Nous avons rédigé le fichier de configuration en local dans le dossier conf. La config pour le reverse-proxy est diponible dans le fichier conf/sites-available/001-reverse-proxy.conf. Nous précisons que l'Host doit être demo.api.ch à l'aide de ServerName, puis à l'aide des commandes ProxyPass et ProxyPassReverse, nous indiquons à notre proxy que le site statique (adresse ip 172.0.7.2:80) est à la racine du site, "/", et que le site dynamique avec le flux json (adresse ip 172.0.7.3:3000) est à l'adresse "/pets/".

Nous avons également fourni un site par défaut, décrit par le fichier de configuration 000-default.conf. Il est important de fournir un site par défaut, afin de rerouter les demandes qui ne précisent pas de Host vers ce dernier. Sinon, les demandes sans Host seraient aussi redirigées vers notre reverse-proxy, or nous voulons uniquement les demandes adressées au Host demo.api.ch.

Les deux dernières commandes du Dockerfile permettent d'activer les modules proxy et proxy_http, afin de permettre l'utilisation de ProxyPass et ProxyPassReverse, puis d'activer les deux sites décrits dans les fichiers de configuration ci-dessus, afin qu'ils se retrouvent dans le dossier /etc/apache2/sites-enabled.

Pour pouvoir tester notre infrastructure sur un navigateur web, il faut faire en sorte que le navigateur envoie le bon Host dans la requête. Pour cela il faut configurer le DNS. Sous Debian 11 il faut mapper localhost vers le Host, ici demo.api.ch, dans le fichier /etc/hosts. Sous Windows, il faut modifier le fichier C:\Windows\System32\drivers\etc\hosts.

    127.0.0.1 demo.api.ch
    
Une fois que nous avons fait tous ces ajouts, nous pouvons créer l'image api/api-rp en allant nous placer dans le dossier docker-files/apache-reverse-proxy/ et en lançant la commande :

    docker build -t api/api-rp .

Une fois que le reverse proxy est configuré il n'y a plus besoin de mapper les ports pour les services, comme mentionné plus haut, car apache s'occupe de le rediriger en sortant du docker. En démarrant la procédure de 0, sans aucun container en cours d'exécution, les commandes suivantes permettent de mettre en place les 2 containers de services ainsi que le reverse-proxy :

    docker run -d --name api-static api/api-static
    docker run -d --name api-dynamic api/api-dynamic
    docker run -p 8080:80 -d --name api-rp api/api-rp

Maintenant les deux sites sont visibles aux adresses [http://demo.api.ch:8080](http://demo.api.ch:8080) et [http://demo.api.ch:8080/pets/](http://demo.api.ch:8080/pets/)

Note : Ce setup est très fragile car les adresses IP sont hardcodées dans le fichier de configuration, et il faut toujours s'assurer de démarrer la procédure avec aucun container en cours d'exécution, et d'exécuter les commander run dans le bon ordre.

# Partie 4 : Requêtes AJAX avec JQuery (fb-ajax-jquery)

Pour faire nos requêtes AJAX, nous avons utilisé la librairie Javascript JQuery. Depuis notre browser, on envoie des requêtes (AJAX) en arrière-plan au serveur dynamique pour récupérer des données : les paires d'animaux colorés. A partir de ces données on va mettre à jour notre site web statique afin d'afficher le nom du premier animal dans la couleur correspondante, si la requête nous renvoie au moins une paire d'animaux colorés.

Dans cette partie nous avons donc modifié le dossier src de notre partie 1, pour y ajouter un script Javascript qui fera les requêtes mentionnées ci-dessus. Il prend le premier animal du flux JSON (du site dynamique réalisé à la partie 2 qui se trouve à l'adresse /pets/) pour l'afficher dans une balise span HTML avec le nom de class pets que nous avons ajoutée pour le bien de notre démo dans le fichier index.html. Le nom de l'animal est affiché dans sa couleur. Le script refait une nouvelle requête automatiqmenet toutes les 2 secondes.
Le nom du script doit également être ajouté en bas de la page HTML index.html dans des balises script :

    <script src="pets.js"></script>
    
Une fois que nous avons fait tous ces ajouts, nous pouvons recréer l'image api/api-static en allant nous placer dans le dossier docker-files/apache-php-image/ et en lançant la commande :

    docker build -t api/api-static .

Finalement, de manière similaire à la partie 3, nous pouvons tester notre infrastructure en suivant la procédure suivante, en assumant qu'aucun container n'est en cours d'exécution :
    
    docker run -d --name api-static api/api-static
    docker run -d --name api-dynamic api/api-dynamic
    docker run -p 8080:80 -d --name api-rp api/api-rp
    
Et nous pouvons admirer le resultat à l'adresse [http://demo.api.ch:8080](http://demo.api.ch:8080).

# Partie 5 : Reverse proxy avec apache, configuration dynamique (fb-dynamic-configuration)

Un des problèmes fondamentaux avec notre infrastructure telle que nous l'avons laissée à la fin de la partie 4, est le fait que nous avons codé "en dur" les adresses IP dans le fichier de configuration de notre reverse proxy. Cette solution, bien que fonctionnelle sous certaines conditions, est non seulement peu élégante, mais surtout extrêmement fragile. En effet, elle implique de lancer les containers dans un ordre précis et nécessite de vérifier à la main que les adresses IP attribuées aux containers sont bien celles auxquelles on s'attend. Rien ne nous garantit qu'elles seront effectivement les bonnes !

Cette partie 5 nous permet donc de corriger ce problème en introduisant plus de flexibilté, car l'adresse ip des deux containers sera fournie dynamiquement au moment du lancement du reverse proxy, via l'utilisation de variables d'environnement, et non plus statiquement dans des fichiers de configuration.

Afin de communiquer entre l'intérieur et l'extérieur du container, nous avons décidé d'utiliser des variables d'environnement. Une variable STATIC_APP afin de récupérer l'adresse ip de notre serveur web statique, et une variable DYNAMIC_APP pour l'adresse du serveur dynamique. Avec le flag -e de la commande docker run, nous pouvons démarrer un container en lui passant des variables d'environnement initialisées. À l'intérieur du container du reverse-proxy, le script php décrit ci-dessous pourra récupérer les valeurs desdites variables, pour pouvoir ensuite les injecter dans le fichier de configuration.

Notre propre script php cité ci-dessus, templates/config-template.php, récupère les deux variables avec la fonction php getenv( ), et print les variables dans le script de configuration de l'étape 3.

Afin de générer dynamiquement notre fichier de configuration au démarrage du container, il est important d'observer comment est construite l'image php choisie pour notre reverse-proxy. Dans le Dockerfile de l'image, nous pouvons observer que la dernière instruction et le fait d'exécuter le script apache2-foreground au démarrage du container. Ce que nous avons fait, c'est reprendre ce script, que nous trouvons ici : [php:7.2/apache2-foreground](https://github.com/docker-library/php/blob/fbba7966bc4ca30a8bb2482cd694a798a50f4406/7.2/buster/apache/apache2-foreground), et de le modifier pour y ajouter l'exécution de notre propre script qui génère le fichier de configuration 001-reverse-proxy.conf à partir des variables d'environnement. 

Dans le Dockerfile du reverse-proxy, il faut également copier la nouvelle version de apache2-foreground au bon endroit dans l'image, à savoir dans /usr/local/bin/ et d'ajouter le script php dans /var/apache2/templates.

Finalement, nous pouvons reconstruire l'image du reverse-proxy pour prendre en compte les modifications : 

    docker build -t api/api-rp .

Puis, de manière similaire aux parties 3 et 4, nous pouvons tester notre infrastructure en suivant la procédure suivante, en assumant qu'aucun container n'est en cours d'exécution :
    
    docker run -d --name api-static api/api-static
    docker run -d --name api-dynamic api/api-dynamic
    
Un fois ces deux services lancés, nous pouvons trouver leur adresse ip avec :

    docker inspect api-static | grep -i ipaddr
    docker inspect api-dynamic | grep -i ipaddr

Et introduire finalement le résultat dans les variables d'environnement en lançant le container api-rp : 

    docker run -d -e STATIC_APP=172.17.0.2:80 -e DYNAMIC_APP=172.17.0.3:3000 --name api-rp -p 8080:80 api/api-rp
    
Et nous pouvons admirer le resultat à l'adresse [http://demo.api.ch:8080](http://demo.api.ch:8080).

# Partie 6 : Étapes additionnelles (fb-traefik)

Afin de compléter et d'améliorer notre infrastructure, nous avons décidé de mettre en place du load-balancing entre plusieurs containers pour chaque service, la gestion d'un cluster dynamique et de sticky sessions. Pour cela, nous avons utilisé le reverse-proxy fourni par Traefik. Traefik permet très simplement d'implémenter ces 3 fonctionnalités, le tout à l'aide de docker-compose. Finalement nous avons également ajouté la gestion graphique de notre infrastructure et de nos services à l'aide de Portainer, que nous avons également ajouté via docker-compose. 

## docker-compose

Docker-compose permet de décrire la structure des services à ajouter dans un projet, et de les lancer via une seule commande docker-compose up, ou de les stopper via la commande docker-compose down.
Un fichier docker-compose.yml à la racine du projet décrit les fonctionnement des différents services dont nous aurons besoin pour implémenter notre infrastructure finale.

## Traefik

Là où notre reverse-proxy apache avait besoin d'un fichier de configuration contenant tous les chemins possibles vers nos serveurs (le fichier 001-reverse-proxy.conf), Traefik lui récupère le bon serveur directement en allant chercher l'information fournie par des providers. Au moment de déployer les serveurs, décrits dans le docker-compose, on attache une information qui indique à Traefik les caractéristiques des requêtes que le serveur peut gérer. Dans notre infrastructure, ces informations correspondent au Host 'demo.api.ch', et au path '/' pour notre serveur statique, et '/pets/' pour notre serveur dynamique. Dans le cas du provider Docker, Traefik récupère ces informations via l'utilisation de labels.

Dans notre fichier docker-compose.yml, nous avons donc décrits 4 services. 

Le premier concerne le reverse-proxy. Pour cela nous utilisons l'image Traefik officielle, la version 2.5. Nous déclarons que Docker est un provider, et nous mappons les ports suivants : 9090:80 pour notre site web, et 8080:8080 pour le dashboard Traefik.

Le deuxième concerne le serveur web static. L'option build permet de reconstruire l'image à chaque fois que nous lançons le docker-compose, sans avoir à se soucier de recréer les images à la main. Nous déployons directement 3 serveurs différents :

    deploy:
      replicas: 3

et à l'aide de labels nous indiquons à Traefik que le service est accessible par l'Host 'demo.api.ch' via le path '/'. 

     - "traefik.http.routers.apache.rule=PathPrefix(`/`) && Host(`demo.api.ch`)"

Nous activons également l'utilisation de sticky sessions via les labels, et leur utilisation est décrite dans la section correspondante plus bas.

     - "traefik.http.services.apache.loadbalancer.sticky=true"
     - "traefik.http.services.apache.loadbalancer.sticky.cookie.name=cookie"

Le 3ème service concerne le serveur dynamique qui génère les animaux colorés. A nouveau nous déployons 2 serveurs différents, et nous indiquons que le service est accessible par l'Host 'demo.api.ch' via le path '/pets/'. Nous précisons également que le port du service est le 3000.

      - "traefik.http.services.express.loadbalancer.server.port=3000"
      - "traefik.http.routers.express.rule=PathPrefix(`/pets/`) && Host(`demo.api.ch`)"
      
Nous utilisons un middleware afin de redigirer les requêtes AJAX.
      
      - "traefik.http.routers.express.middlewares=express-replacepath"
      - "traefik.http.middlewares.express-replacepath.replacepath.path=/"
      
Le dernier service, portainer, est décrit dans la section correspondante plus bas.

Après l'exécution de 

    docker-compose up -d
    
L'option -d permet de lancer les services en arrière plan. 

On peut alors observer notre magnifique site web statique à l'adresse [http://demo.api.ch:9090](http://demo.api.ch:9090).

### Dynamic cluster

La gestion dynamique des serveurs des différents services est gérée automatiquement par Traefik. Pour s'en convaincre, nous pouvons réaliser la manipulation suivante.

A la racine de notre projet, où se trouve le fichier docker-compose.yml, nous pouvons lancer notre infrastructure à l'aide de la commande :
    
    docker-compose up -d
    
Un docker ps nous permet de voir que 7 containers sont en cours d'exécution. 1 pour le reverse-proxy, 1 pour portainer, 3 pour le service web statique, et 2 pour le service Javascript dynamique. Si on scale le nombre de serveurs pour le service web statique, par exemple : 

    docker-composer up --scale apache_static=5

On peut remarquer après un nouveau docker ps que désormais 9 containers sont en cours d'exécution, et le site web statique [http://demo.api.ch:9090](http://demo.api.ch:9090) est toujours accessible et fonctionnel. 

Un petit tour sur le [dashboard Traefik](http://demo.api.ch:8080/dashboard/#/) nous aurait également permis d'observer l'ajout dynamique des containers.

### Load-balancing

Comme pour la gestion dynamique des serveurs, le load-balancing est géré automatiquement par Traefik. Pour s'en convaincre, nous pouvons réaliser la manipulation suivante.

Lançons notre infrastructure en premier-plan cette fois-ci, afin d'avoir accès directement aux logs dans la console.

    docker-compose up
    
Lorsque l'on accède à notre site web statique, nous pouvons alors observer dans la console que les requêtes AJAX sont bien réparties entre les deux noeuds du service express_dynamic. Chaque serveur reçoit une requête sur deux.

    express_dynamic_1  | 8
    express_dynamic_1  | [
    express_dynamic_1  |   { animal: 'Cotton Rat', color: '#31acc1' },
    express_dynamic_1  |   { animal: 'Geckos', color: '#c239a6' },
    express_dynamic_1  |   { animal: 'Collared Lemur', color: '#d36c21' },
    express_dynamic_1  |   { animal: 'Carp', color: '#e221ad' },
    express_dynamic_1  |   { animal: 'Pig', color: '#f25c5a' },
    express_dynamic_1  |   { animal: 'Bushshrike', color: '#89b61e' },
    express_dynamic_1  |   { animal: 'American Bison', color: '#000028' },
    express_dynamic_1  |   { animal: 'Pig', color: '#11ad92' }
    express_dynamic_1  | ]
    
    express_dynamic_2  | 1
    express_dynamic_2  | [ { animal: 'Tan Bristlemouth', color: '#97ccd2' } ]
    
    express_dynamic_1  | 2
    express_dynamic_1  | [
    express_dynamic_1  |   { animal: 'Vigtorniella Worm', color: '#1c0e24' },
    express_dynamic_1  |   { animal: 'Pigs and Hogs', color: '#f6c066' }
    express_dynamic_1  | ]
    
    express_dynamic_2  | 1
    express_dynamic_2  | [ { animal: 'Kangaroo Rat', color: '#69ab43' } ]

Ce qui prouve que Traefik s'occupe du load-balancing.

### Sticky sessions

Pour la gestion des sticky sessions pour notre serveur web statique, nous avons du ajouter les labels suivants :

     - "traefik.http.services.apache.loadbalancer.sticky=true"
     - "traefik.http.services.apache.loadbalancer.sticky.cookie.name=cookie"
     
Ainsi, nous avons un cookie nommé 'cookie' qui permet à Traefik de determiner vers quel container diriger la requête si plusieurs requêtes ont lieu durant la même session. 
Si on lance notre infrastructure en premier plan, qu'on accède au site web statique, et qu'on rafraîchit la page plusieurs fois, on observe que c'est toujours le même serveur qui nous répond. Si on lance ensuite une fenêtre en navigation privée, qui n'envoie pas de cookies, nous observons que la requête est distribuée vers un autre serveur, et ainsi de suite en suivant un ordre en round-robin.

    apache_static_1    | 192.168.176.7 - - [17/Jan/2022:19:03:44 +0000] "GET / HTTP/1.1" 200 1132 "-" "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/97.0.4692.71 Safari/537.36"
    apache_static_1    | 192.168.176.7 - - [17/Jan/2022:19:03:44 +0000] "GET /css/3-col-portfolio.css HTTP/1.1" 200 568 "http://demo.api.ch:9090/" "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/97.0.4692.71 Safari/537.36"
    apache_static_1    | 192.168.176.7 - - [17/Jan/2022:19:03:44 +0000] "GET /pets.js HTTP/1.1" 200 556 "http://demo.api.ch:9090/" "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/97.0.4692.71 Safari/537.36"
    apache_static_1    | 192.168.176.7 - - [17/Jan/2022:19:03:44 +0000] "GET /vendor/bootstrap/css/bootstrap.min.css HTTP/1.1" 200 21375 "http://demo.api.ch:9090/" "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/97.0.4692.71 Safari/537.36"
    apache_static_1    | 192.168.176.7 - - [17/Jan/2022:19:03:44 +0000] "GET /vendor/jquery/jquery.min.js HTTP/1.1" 200 30611 "http://demo.api.ch:9090/" "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/97.0.4692.71 Safari/537.36"
    apache_static_1    | 192.168.176.7 - - [17/Jan/2022:19:03:44 +0000] "GET /vendor/bootstrap/js/bootstrap.bundle.min.js HTTP/1.1" 200 20993 "http://demo.api.ch:9090/" "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/97.0.4692.71 Safari/537.36"
    apache_static_1    | 192.168.176.7 - - [17/Jan/2022:19:03:44 +0000] "GET /favicon.ico HTTP/1.1" 404 436 "http://demo.api.ch:9090/" "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/97.0.4692.71 Safari/537.36"
    express_dynamic_1  | 4
    express_dynamic_1  | [
    express_dynamic_1  |   { animal: 'Toad', color: '#346063' },
    express_dynamic_1  |   { animal: 'Copperhead', color: '#0571a8' },
    express_dynamic_1  |   { animal: 'Chinchillas', color: '#b069c9' },
    express_dynamic_1  |   { animal: 'Red Panda', color: '#84151e' }
    express_dynamic_1  | ]
    apache_static_1    | 192.168.176.7 - - [17/Jan/2022:19:03:45 +0000] "GET / HTTP/1.1" 200 1132 "-" "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/97.0.4692.71 Safari/537.36"
    express_dynamic_2  | 4
    express_dynamic_2  | [
    express_dynamic_2  |   { animal: 'Aldabra Tortoise', color: '#79dcda' },
    express_dynamic_2  |   { animal: 'Rhea', color: '#84d4c5' },
    express_dynamic_2  |   { animal: 'Frog', color: '#b44425' },
    express_dynamic_2  |   { animal: 'Mice', color: '#ee2477' }
    express_dynamic_2  | ]
    express_dynamic_1  | 2
    express_dynamic_1  | [
    express_dynamic_1  |   { animal: 'White-throated Bee Eater', color: '#553552' },
    express_dynamic_1  |   { animal: 'Coati', color: '#971f85' }
    express_dynamic_1  | ]
    apache_static_1    | 192.168.176.7 - - [17/Jan/2022:19:03:48 +0000] "GET / HTTP/1.1" 200 1132 "-" "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/97.0.4692.71 Safari/537.36"
    express_dynamic_2  | 5
    express_dynamic_2  | [
    express_dynamic_2  |   { animal: 'Glowing Sucker Octopus', color: '#a6d5e4' },
    express_dynamic_2  |   { animal: 'Python', color: '#405463' },
    express_dynamic_2  |   { animal: 'White-throated Bee Eater', color: '#7d181b' },
    express_dynamic_2  |   { animal: 'Bass', color: '#a1cfb4' },
    express_dynamic_2  |   { animal: 'Lion', color: '#596ecc' }
    express_dynamic_2  | ]
    express_dynamic_1  | 2
    express_dynamic_1  | [
    express_dynamic_1  |   { animal: 'Horseshoe Crab', color: '#d294c2' },
    express_dynamic_1  |   { animal: 'Little Penguin', color: '#559db1' }
    express_dynamic_1  | ]
    apache_static_2    | 192.168.176.7 - - [17/Jan/2022:19:03:53 +0000] "GET / HTTP/1.1" 200 1132 "-" "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/97.0.4692.71 Safari/537.36"
    apache_static_2    | 192.168.176.7 - - [17/Jan/2022:19:03:53 +0000] "GET /vendor/bootstrap/css/bootstrap.min.css HTTP/1.1" 200 21375 "http://demo.api.ch:9090/" "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/97.0.4692.71 Safari/537.36"
    apache_static_2    | 192.168.176.7 - - [17/Jan/2022:19:03:53 +0000] "GET /css/3-col-portfolio.css HTTP/1.1" 200 568 "http://demo.api.ch:9090/" "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/97.0.4692.71 Safari/537.36"
    apache_static_2    | 192.168.176.7 - - [17/Jan/2022:19:03:53 +0000] "GET /pets.js HTTP/1.1" 200 556 "http://demo.api.ch:9090/" "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/97.0.4692.71 Safari/537.36"
    apache_static_2    | 192.168.176.7 - - [17/Jan/2022:19:03:53 +0000] "GET /vendor/bootstrap/js/bootstrap.bundle.min.js HTTP/1.1" 200 20993 "http://demo.api.ch:9090/" "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/97.0.4692.71 Safari/537.36"
    apache_static_2    | 192.168.176.7 - - [17/Jan/2022:19:03:53 +0000] "GET /vendor/jquery/jquery.min.js HTTP/1.1" 200 30611 "http://demo.api.ch:9090/" "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/97.0.4692.71 Safari/537.36"
    express_dynamic_2  | 1
    express_dynamic_2  | [ { animal: 'Donkey', color: '#4c3630' } ]
    express_dynamic_1  | 5
    express_dynamic_1  | [
    express_dynamic_1  |   { animal: 'Toad', color: '#969f73' },
    express_dynamic_1  |   { animal: 'Sawfish', color: '#fc14ba' },
    express_dynamic_1  |   { animal: 'Hawaiian Monk Seal', color: '#736df5' },
    express_dynamic_1  |   { animal: 'Icefish', color: '#1c13a4' },
    express_dynamic_1  |   { animal: 'Cownose Ray', color: '#264e9b' }
    express_dynamic_1  | ]
    express_dynamic_2  | 2
    express_dynamic_2  | [
    express_dynamic_2  |   { animal: 'Blue Iguana', color: '#3f0bbb' },
    express_dynamic_2  |   { animal: 'Dogs', color: '#27d8eb' }
    express_dynamic_2  | ]
    apache_static_3    | 192.168.176.7 - - [17/Jan/2022:19:04:09 +0000] "GET / HTTP/1.1" 200 1132 "-" "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/97.0.4692.71 Safari/537.36"
    apache_static_3    | 192.168.176.7 - - [17/Jan/2022:19:04:09 +0000] "GET /vendor/bootstrap/css/bootstrap.min.css HTTP/1.1" 200 21375 "http://demo.api.ch:9090/" "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/97.0.4692.71 Safari/537.36"
    apache_static_3    | 192.168.176.7 - - [17/Jan/2022:19:04:09 +0000] "GET /css/3-col-portfolio.css HTTP/1.1" 200 568 "http://demo.api.ch:9090/" "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/97.0.4692.71 Safari/537.36"
    apache_static_3    | 192.168.176.7 - - [17/Jan/2022:19:04:09 +0000] "GET /pets.js HTTP/1.1" 200 556 "http://demo.api.ch:9090/" "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/97.0.4692.71 Safari/537.36"
    apache_static_3    | 192.168.176.7 - - [17/Jan/2022:19:04:09 +0000] "GET /vendor/bootstrap/js/bootstrap.bundle.min.js HTTP/1.1" 200 20993 "http://demo.api.ch:9090/" "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/97.0.4692.71 Safari/537.36"
    apache_static_3    | 192.168.176.7 - - [17/Jan/2022:19:04:09 +0000] "GET /vendor/jquery/jquery.min.js HTTP/1.1" 200 30611 "http://demo.api.ch:9090/" "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/97.0.4692.71 Safari/537.36"
    express_dynamic_1  | 10
    express_dynamic_1  | [
    express_dynamic_1  |   { animal: 'Badger', color: '#8c6727' },
    express_dynamic_1  |   { animal: 'Sand Cat', color: '#84d9ff' },
    express_dynamic_1  |   { animal: 'Badger', color: '#40aa9d' },
    express_dynamic_1  |   { animal: 'Guinea', color: '#4708a9' },
    express_dynamic_1  |   { animal: 'Macaw', color: '#d9294d' },
    express_dynamic_1  |   { animal: 'Acantharea', color: '#b9a739' },
    express_dynamic_1  |   { animal: 'Horse', color: '#629e7c' },
    express_dynamic_1  |   { animal: 'Guinea Fowl', color: '#a149f4' },
    express_dynamic_1  |   { animal: 'Toad', color: '#e1bc93' },
    express_dynamic_1  |   { animal: 'Gerbils', color: '#48e705' }
    express_dynamic_1  | ]

Ce qui nous montre bien l'utilisation de sticky sessions.

## Portainer

Finalement, nous avons ajouté un service portainer à notre docker-compose, exposé sur le port 9000 et donc accessible à l'adresse [http://demo.api.ch:9000](http://demo.api.ch:9000), afin de pouvoir gérer l'ajout / la suppression de container via une interface graphique intuitive. Nous n'avons malheureusement pas eu le temps d'intégrer portainer à notre reverse-proxy. Il serait intéressant dans le futur d'intégrer également un système de cookies afin de récupérer l'authentification, pour ne plus avoir à recréer un profil à chaque nouvelle utilisation.
