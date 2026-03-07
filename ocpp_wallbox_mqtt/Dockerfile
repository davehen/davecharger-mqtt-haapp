ARG BUILD_FROM
FROM ${BUILD_FROM}

ENV PERL_MM_USE_DEFAULT=1
ENV PERL_CPANM_OPT="--notest"

# Runtime + build deps (Alpine)
RUN apk add --no-cache \
    perl \
    perl-utils \
    bash \
    python3 \
    ca-certificates \
    git \
    make \
    gcc \
    musl-dev \
    perl-dev \
    perl-app-cpanminus

# Moduli CPAN necessari
RUN cpanm JSON \
 && cpanm Config::IniFiles \
 && cpanm Time::HiRes \
 && cpanm MQTT::Simple || true \
 && cpanm Mojolicious || true


# Pulizia build deps (lascia perl + cpanm)
RUN apk del --no-cache \
    make gcc musl-dev perl-dev

COPY rootfs /

# Scarica librerie JS nel build (no CDN a runtime)
RUN wget -q -O /var/www/chart.min.js                 "https://cdn.jsdelivr.net/npm/chart.js@4.4.1/dist/chart.umd.min.js" \
 && wget -q -O /var/www/luxon.min.js                  "https://cdn.jsdelivr.net/npm/luxon@3/build/global/luxon.min.js" \
 && wget -q -O /var/www/chartjs-adapter-luxon.min.js  "https://cdn.jsdelivr.net/npm/chartjs-adapter-luxon@1/dist/chartjs-adapter-luxon.umd.min.js" \
 && wget -q -O /var/www/hammer.min.js                 "https://cdn.jsdelivr.net/npm/hammerjs@2.0.8/hammer.min.js" \
 && wget -q -O /var/www/chartjs-plugin-zoom.min.js    "https://cdn.jsdelivr.net/npm/chartjs-plugin-zoom@2/dist/chartjs-plugin-zoom.min.js"

COPY run.sh /run.sh
RUN chmod +x /run.sh

CMD ["/run.sh"]
