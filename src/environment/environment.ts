import environmentConfig from "../../ambiente.json";

const environment_config: any = {
  dev: {
    api_server: "http://192.168.1.106:3000",
    landing_url: "http://localhost:4200",
  },
  prod: {
    api_server: `https://smartoficina.com.br`,
    landing_url: "/",
  },
};

const currentEnv = environmentConfig.env;
const config = environment_config[currentEnv] || environment_config["prod"];

export const environment = {
  api_server: config.api_server,
  landing_url: config.landing_url,
  minInstallmentPrice: 79.9,
  installmentIncrement: 19.9,
  maxInstallments: 12,
};
