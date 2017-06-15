import os
import subprocess
		
class EasyGit():

	def __init__(self, path=None):
		if path is None:
			self.repo_path =  os.getcwd()
		self.repo_path = path

	def pull(self):
		return self.__run_command__("git pull")

	def set_user(self, user):
		self.__run_command__("git config user.name " + user)
		BASE_DIR = os.path.dirname(os.path.dirname(__file__))
		key_path = os.path.join(BASE_DIR, 'id_rsa')
		return self.__run_command__("git config core.sshCommand 'ssh -i "+ key_path+ "'")

	def push(self):
		return self.__run_command__("git push")

	def commit(self, message):
		self.__run_command__("git add .")
		return self.__run_command__("git commit -m \"" + message +"\"")

	def __run_command__(self, command):
		return subprocess.check_output(command , shell=True, cwd=self.repo_path)