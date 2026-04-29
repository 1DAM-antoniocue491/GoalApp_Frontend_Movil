import { LeagueRequest, LeagueResponse } from "../types/dashboard.actions.types";

const BASE_URL = 'https://goalapp-backend-j2cx.onrender.com/api/v1';

/*Para conectar con el backend le pasamos los datos
y además demostramos que somos autorizados  */
export async function createLeague(data: LeagueRequest, token: string) {
  const response = await fetch(`${BASE_URL}/ligas
    `, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });

  const json = await response.json();

  console.log('RESPONSE BACKEND:', json);

  return json;
}
