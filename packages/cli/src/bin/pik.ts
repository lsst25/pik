#!/usr/bin/env node
import { program, initializeProgram } from '../lib/program.js';

await initializeProgram();
program.parse();
