#!/usr/bin/env python3
"""Tiny dev server for JSVERSE: threaded, big connection backlog (module-heavy pages load dozens of files at once)
and no-cache headers so edits show up on refresh.  Usage:  python3 serve.py [port]   (default: $PORT or 8746)"""
import os, sys
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer

class Handler(SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Cache-Control', 'no-store')
        super().end_headers()
    def log_message(self, *a): pass

class Server(ThreadingHTTPServer):
    request_queue_size = 256
    daemon_threads = True

if __name__ == '__main__':
    os.chdir(os.path.dirname(os.path.abspath(__file__)))   # always serve the JSVERSE folder, wherever it is launched from
    port = int(sys.argv[1]) if len(sys.argv) > 1 else int(os.environ.get('PORT', 8746))
    print(f'JSVERSE on http://localhost:{port}')
    Server(('', port), Handler).serve_forever()
