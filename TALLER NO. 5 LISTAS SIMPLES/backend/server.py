"""API REST mínima sobre TaskLinkedList, usando solo la librería estándar.

Ejecutar: python server.py
Endpoints:
  GET    /api/tasks          -> lista todas las tareas
  POST   /api/tasks          -> crea tarea, body: {"title": "..."}
  PATCH  /api/tasks/<id>     -> alterna completed
  DELETE /api/tasks/<id>     -> elimina la tarea

TODO: persistencia en disco/DB. Hoy el estado vive en memoria y se pierde
al reiniciar el proceso; aceptable para el taller, no para producción real.
"""

from __future__ import annotations

import json
import re
import threading
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer

from linked_list import TaskLinkedList

tasks = TaskLinkedList()
lock = threading.Lock()  # ThreadingHTTPServer atiende requests concurrentes

TASK_ID_RE = re.compile(r"^/api/tasks/(\d+)$")


class TaskHandler(BaseHTTPRequestHandler):
    def _send_json(self, status: int, payload: object) -> None:
        body = json.dumps(payload).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Access-Control-Allow-Origin", "*")
        self.end_headers()
        self.wfile.write(body)

    def _read_json_body(self) -> dict:
        length = int(self.headers.get("Content-Length", 0))
        if length == 0:
            return {}
        raw = self.rfile.read(length)
        try:
            return json.loads(raw)
        except json.JSONDecodeError as exc:
            raise ValueError("invalid JSON body") from exc

    def do_OPTIONS(self) -> None:  # preflight CORS
        self.send_response(204)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, PATCH, DELETE, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.end_headers()

    def do_GET(self) -> None:
        if self.path == "/api/tasks":
            with lock:
                self._send_json(200, tasks.to_list())
            return
        self._send_json(404, {"error": "not found"})

    def do_POST(self) -> None:
        if self.path != "/api/tasks":
            self._send_json(404, {"error": "not found"})
            return
        try:
            body = self._read_json_body()
            with lock:
                node = tasks.add(body.get("title", ""))
                data = node.to_dict()
            self._send_json(201, data)
        except ValueError as exc:
            self._send_json(400, {"error": str(exc)})

    def do_PATCH(self) -> None:
        match = TASK_ID_RE.match(self.path)
        if not match:
            self._send_json(404, {"error": "not found"})
            return
        task_id = int(match.group(1))
        with lock:
            node = tasks.find(task_id)
            if node is None:
                self._send_json(404, {"error": "task not found"})
                return
            node.completed = not node.completed
            data = node.to_dict()
        self._send_json(200, data)

    def do_DELETE(self) -> None:
        match = TASK_ID_RE.match(self.path)
        if not match:
            self._send_json(404, {"error": "not found"})
            return
        task_id = int(match.group(1))
        with lock:
            found = tasks.remove(task_id)
        self._send_json(200 if found else 404, {"deleted": found})

    def log_message(self, format: str, *args: object) -> None:  # silencia logs por request
        pass


def main() -> None:
    port = 8000
    server = ThreadingHTTPServer(("0.0.0.0", port), TaskHandler)
    print(f"Task API escuchando en http://localhost:{port}")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        server.shutdown()


if __name__ == "__main__":
    main()
