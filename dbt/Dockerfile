FROM python:3.12-slim

RUN pip install --no-cache-dir dbt-postgres==1.8.2

WORKDIR /dbt

COPY . .

ENV DBT_PROFILES_DIR=/dbt

ENTRYPOINT ["/bin/sh", "-c"]
CMD ["dbt seed && dbt run"]
