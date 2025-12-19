FROM quay.io/keycloak/keycloak:23.0

COPY realm-config.json /opt/keycloak/data/import/

ENV KC_PROXY=edge
ENV KC_HOSTNAME_STRICT=false

ENTRYPOINT ["/opt/keycloak/bin/kc.sh"]
CMD ["start", "--import-realm"]
