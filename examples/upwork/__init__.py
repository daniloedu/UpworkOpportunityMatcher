"""Top-level package for python-upwork."""

from .config import Config
from .client import Client
from . import routers

__author__ = """Maksym Novozhylov"""
__email__ = "mnovozhilov@upwork.com"
__version__ = "3.2.0"

__all__ = ("Config", "Client", "routers")
