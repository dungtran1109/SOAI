import datetime
import csv
import socket
from utils import get_cpu_info, get_memory, get_gpu

class PerformanceLogger:
    def __init__(self) -> None:
        self.record = {}
        self.question = ""
        self.answer = ""
        self.start_time = datetime.datetime.now()
        self.end_time = datetime.datetime.now()
        self.machine = socket.gethostname()
        self.cpu = get_cpu_info()
        self.ram = get_memory()
        self.gpu = get_gpu()

    def open(self, question, model):
        self.question = question
        self.model = model
        self.start_time = datetime.datetime.now()

    def close(self, answer):
        self.answer = answer
        self.end_time = datetime.datetime.now()
        difference = self.end_time - self.start_time
        filename = "report.csv"
        with open(filename, 'a') as csvfile: 
            csvwriter = csv.writer(csvfile)
            csvwriter.writerow([self.machine, self.cpu, self.ram, self.gpu, self.model, self.question,self.answer,str(self.record["retriever"]), str(self.record["llm"]), str(difference.total_seconds())])

    def start(self, event):
        self.record[event] = datetime.datetime.now()

    def stop(self, event):
        if event in self.record:
            difference = datetime.datetime.now() - self.record[event]
            self.record[event] = difference.total_seconds()

    def summarize(self):
        return self.record
